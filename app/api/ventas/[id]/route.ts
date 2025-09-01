import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

// GET - Obtener venta específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const venta = await prisma.venta.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        cliente: true,
        VentaProducto: {
          include: {
            producto: true
          }
        },
        servicios: {
          include: {
            servicio: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(venta);
  } catch (error) {
    console.error("Error al obtener venta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar venta (reversar stock si es necesario)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la venta existe y pertenece al usuario
    const existingVenta = await prisma.venta.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        VentaProducto: {
          include: {
            producto: true
          }
        },
        servicios: true
      }
    });

    if (!existingVenta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la venta en una transacción y restaurar stock
    await prisma.$transaction(async (tx) => {
      // Restaurar stock de productos vendidos
      for (const ventaProducto of existingVenta.VentaProducto) {
        await tx.producto.update({
          where: { id: ventaProducto.productoId },
          data: {
            cantidad: {
              increment: ventaProducto.cantidad
            }
          }
        });
      }

      // Eliminar items de productos
      await tx.ventaProducto.deleteMany({
        where: { ventaId: params.id }
      });

      // Eliminar items de servicios
      await tx.ventaServicio.deleteMany({
        where: { ventaId: params.id }
      });

      // Eliminar movimiento asociado
      await tx.movimiento.deleteMany({
        where: { ventaId: params.id }
      });

      // Eliminar la venta
      await tx.venta.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}