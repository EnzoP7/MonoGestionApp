import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { quickServicioSchema } from "@/lib/validators/venta";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = quickServicioSchema.parse(body);

    const servicio = await prisma.servicio.create({
      data: {
        nombre: validatedData.nombre,
        precioBase: validatedData.precioBase,
        descripcion: validatedData.descripcion || null,
        userId,
      },
    });

    return NextResponse.json(servicio, { status: 201 });
  } catch (error) {
    console.error("Error al crear servicio rápido:", error);
    
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