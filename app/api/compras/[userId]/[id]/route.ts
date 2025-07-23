import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ DELETE: Eliminar compra, su egreso, su movimiento y revertir stock
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
    await prisma.$transaction(async (tx) => {
      // Obtener productos y revertir stock
      const productos = await tx.compraProducto.findMany({
        where: { compraId: id },
      });

      for (const p of productos) {
        await tx.producto.update({
          where: { id: p.productoId },
          data: {
            cantidad: { decrement: p.cantidad },
          },
        });
      }

      // Eliminar productos de la compra
      await tx.compraProducto.deleteMany({ where: { compraId: id } });

      // Eliminar egreso relacionado
      await tx.egreso.deleteMany({ where: { compraId: id } });

      // Eliminar movimiento relacionado
      await tx.movimiento.deleteMany({ where: { compraId: id } });

      // Eliminar compra
      await tx.compra.delete({ where: { id } });
    });

    return NextResponse.json({
      message: "Compra y datos asociados eliminados correctamente",
    });
  } catch (error) {
    console.error("[DELETE_COMPRA_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar compra" },
      { status: 500 }
    );
  }
}

// ✅ PUT: Editar compra, actualizar stock, egreso y movimiento
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

    const compraActualizada = await prisma.$transaction(async (tx) => {
      // Actualizar compra
      const actualizada = await tx.compra.update({
        where: { id: compraId },
        data: {
          proveedorId: proveedorId ?? null,
          fecha: new Date(fecha),
          descripcion,
          monto,
        },
      });

      // Obtener productos anteriores
      const productosAnteriores = await tx.compraProducto.findMany({
        where: { compraId },
      });

      const anteriorMap = new Map<string, number>();
      productosAnteriores.forEach((p) =>
        anteriorMap.set(p.productoId, p.cantidad)
      );

      const nuevoMap = new Map<string, number>();
      productos.forEach((p: any) => nuevoMap.set(p.productoId, p.cantidad));

      const allProductoIds = Array.from(
        new Set([...anteriorMap.keys(), ...nuevoMap.keys()])
      );

      for (const productoId of allProductoIds) {
        const anterior = anteriorMap.get(productoId) || 0;
        const nuevo = nuevoMap.get(productoId) || 0;
        const diferencia = nuevo - anterior;

        if (diferencia !== 0) {
          await tx.producto.update({
            where: { id: productoId },
            data: {
              cantidad: {
                increment: diferencia,
              },
            },
          });
        }
      }

      // Reemplazar productos de la compra
      await tx.compraProducto.deleteMany({ where: { compraId } });
      await tx.compraProducto.createMany({
        data: productos.map((p: any) => ({
          compraId,
          productoId: p.productoId,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
        })),
      });

      // Actualizar egreso
      const egresoRelacionado = await tx.egreso.findFirst({
        where: { userId, compraId },
      });

      if (egresoRelacionado) {
        await tx.egreso.update({
          where: { id: egresoRelacionado.id },
          data: {
            fecha: new Date(fecha),
            monto,
            descripcion: descripcion ?? `Actualizado desde compra ${compraId}`,
          },
        });
      }

      // Actualizar movimiento
      const movimientoRelacionado = await tx.movimiento.findFirst({
        where: { userId, compraId },
      });

      if (movimientoRelacionado) {
        await tx.movimiento.update({
          where: { id: movimientoRelacionado.id },
          data: {
            fecha: new Date(fecha),
            monto,
            descripcion: descripcion ?? `Actualizado desde compra ${compraId}`,
          },
        });
      }

      return actualizada;
    });

    return NextResponse.json(compraActualizada);
  } catch (error) {
    console.error("[PUT_COMPRA_ERROR]", error);
    return NextResponse.json(
      { error: "Error al actualizar la compra" },
      { status: 500 }
    );
  }
}
