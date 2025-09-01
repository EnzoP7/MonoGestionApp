import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createServicioSchema = z.object({
  userId: z.string(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precioBase: z.number().positive("El precio base debe ser positivo").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "userId es requerido" },
        { status: 400 }
      );
    }

    const servicios = await prisma.servicio.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        ventas: {
          include: {
            venta: {
              include: {
                cliente: true,
              },
            },
          },
          orderBy: { venta: { createdAt: "desc" } },
          take: 3,
        },
      },
    });

    return NextResponse.json(servicios);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createServicioSchema.parse(body);

    const servicio = await prisma.servicio.create({
      data: {
        userId: validatedData.userId,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        precioBase: validatedData.precioBase,
      },
    });

    return NextResponse.json(servicio, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear servicio:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}