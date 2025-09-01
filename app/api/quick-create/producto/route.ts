import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { quickProductoSchema } from "@/lib/validators/venta";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = quickProductoSchema.parse(body);

    const producto = await prisma.producto.create({
      data: {
        nombre: validatedData.nombre,
        precio: validatedData.precio,
        cantidad: validatedData.cantidad,
        descripcion: validatedData.descripcion || null,
        activo: true,
        userId,
      },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto rápido:", error);
    
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