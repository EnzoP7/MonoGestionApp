import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Falta ID de la compra" },
      { status: 400 }
    );
  }

  try {
    await prisma.compraProducto.deleteMany({ where: { compraId: id } });
    await prisma.compra.delete({ where: { id } });

    return NextResponse.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("[DELETE_COMPRA_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar compra" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const compraId = params.id;
    const body = await req.json();
    const { userId, proveedorId, fecha, descripcion, monto, productos } = body;

    if (!userId || !fecha || !monto || !compraId || !productos) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    console.log("[PUT_COMPRA] Editando compra ID:", compraId);

    const compraActualizada = await prisma.compra.update({
      where: { id: compraId },
      data: {
        proveedorId: proveedorId ?? null,
        fecha: new Date(fecha),
        descripcion,
        monto,
      },
    });

    console.log("[PUT_COMPRA] Compra actualizada correctamente");

    // Obtener productos anteriores
    const productosAnteriores = await prisma.compraProducto.findMany({
      where: { compraId },
    });

    // Crear mapa de productoId => cantidad (anterior)
    const anteriorMap = new Map<string, number>();
    productosAnteriores.forEach((p) =>
      anteriorMap.set(p.productoId, p.cantidad)
    );

    // Crear mapa de productoId => cantidad (nuevo)
    const nuevoMap = new Map<string, number>();
    productos.forEach((p: any) => nuevoMap.set(p.productoId, p.cantidad));

    // Obtener todos los productId únicos
    const allProductoIds = Array.from(
      new Set([...anteriorMap.keys(), ...nuevoMap.keys()])
    );

    // Calcular diferencias y actualizar stock
    for (const productoId of allProductoIds) {
      const anterior = anteriorMap.get(productoId) || 0;
      const nuevo = nuevoMap.get(productoId) || 0;
      const diferencia = nuevo - anterior;

      if (diferencia !== 0) {
        await prisma.producto.update({
          where: { id: productoId },
          data: {
            cantidad: {
              increment: diferencia,
            },
          },
        });
        console.log(
          `[PUT_COMPRA] Stock actualizado para ${productoId}: ${
            diferencia > 0 ? "+" : ""
          }${diferencia}`
        );
      }
    }

    // Reemplazar los productos
    await prisma.compraProducto.deleteMany({ where: { compraId } });
    await prisma.compraProducto.createMany({
      data: productos.map((p: any) => ({
        compraId,
        productoId: p.productoId,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
      })),
    });

    console.log("[PUT_COMPRA] Productos actualizados correctamente");

    const egresoRelacionado = await prisma.egreso.findFirst({
      where: {
        userId,
        compraId: compraId,
      },
    });

    if (egresoRelacionado) {
      await prisma.egreso.update({
        where: { id: egresoRelacionado.id },
        data: {
          fecha: new Date(fecha),
          monto,
          descripcion: `Actualizado desde compra ${compraId}`,
        },
      });

      console.log("[PUT_COMPRA] Egreso relacionado actualizado");
    } else {
      console.warn("[PUT_COMPRA] No se encontró egreso relacionado");
    }

    return NextResponse.json(compraActualizada);
  } catch (error) {
    console.error("[PUT_COMPRA_ERROR]", error);
    return NextResponse.json(
      { error: "Error al actualizar la compra" },
      { status: 500 }
    );
  }
}
