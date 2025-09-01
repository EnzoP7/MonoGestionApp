import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateServicioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  descripcion: z.string().optional(),
  precioBase: z.number().positive("El precio base debe ser positivo").optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        ventas: {
          include: {
            venta: {
              include: {
                cliente: true,
              },
            },
          },
          orderBy: { venta: { createdAt: "desc" } },
        },
      },
    });

    if (!servicio) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(servicio);
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateServicioSchema.parse(body);

    // Verificar que el servicio existe
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id: params.id },
    });

    if (!servicioExistente) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const servicio = await prisma.servicio.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(servicio);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar servicio:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el servicio existe
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id: params.id },
      include: {
        ventas: true,
      },
    });

    if (!servicioExistente) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene ventas asociadas
    if (servicioExistente.ventas.length > 0) {
      return NextResponse.json(
        { message: "No se puede eliminar el servicio porque tiene ventas asociadas" },
        { status: 400 }
      );
    }

    await prisma.servicio.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Servicio eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}