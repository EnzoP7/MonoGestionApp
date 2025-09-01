import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { ventaSchema } from "@/lib/validators/venta";

// GET - Obtener todas las ventas del usuario
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ventas = await prisma.venta.findMany({
      where: { userId },
      orderBy: { fecha: "desc" },
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

    return NextResponse.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva venta
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ventaSchema.parse(body);

    // Verificar stock de productos antes de procesar la venta
    for (const item of validatedData.productos || []) {
      const producto = await prisma.producto.findFirst({
        where: { id: item.productoId, userId }
      });

      if (!producto) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productoId}` },
          { status: 404 }
        );
      }

      if (producto.cantidad < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad}, Requerido: ${item.cantidad}` },
          { status: 400 }
        );
      }
    }

    // Verificar que los servicios existan
    for (const item of validatedData.servicios || []) {
      const servicio = await prisma.servicio.findFirst({
        where: { id: item.servicioId, userId }
      });

      if (!servicio) {
        return NextResponse.json(
          { error: `Servicio no encontrado: ${item.servicioId}` },
          { status: 404 }
        );
      }
    }

    // Verificar cliente si se proporciona
    if (validatedData.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: validatedData.clienteId, userId }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: "Cliente no encontrado" },
          { status: 404 }
        );
      }
    }

    // Crear la venta en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const venta = await tx.venta.create({
        data: {
          userId,
          clienteId: validatedData.clienteId || null,
          fecha: new Date(validatedData.fecha),
          monto: validatedData.monto,
          tipo: validatedData.tipo,
        }
      });

      // Crear items de productos y actualizar stock
      for (const item of validatedData.productos || []) {
        await tx.ventaProducto.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
          }
        });

        // Disminuir stock
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            cantidad: {
              decrement: item.cantidad
            }
          }
        });
      }

      // Crear items de servicios
      for (const item of validatedData.servicios || []) {
        await tx.ventaServicio.create({
          data: {
            ventaId: venta.id,
            servicioId: item.servicioId,
            cantidad: item.cantidad,
            precio: item.precio,
          }
        });
      }

      // Crear movimiento para tracking financiero
      await tx.movimiento.create({
        data: {
          userId,
          tipo: "Venta",
          fecha: new Date(validatedData.fecha),
          monto: validatedData.monto,
          descripcion: `Venta ${validatedData.tipo}`,
          ventaId: venta.id,
        }
      });

      return venta;
    });

    // Obtener la venta completa para devolver
    const ventaCompleta = await prisma.venta.findUnique({
      where: { id: result.id },
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

    return NextResponse.json(ventaCompleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear venta:", error);
    
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}