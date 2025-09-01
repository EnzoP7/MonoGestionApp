import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { quickClienteSchema } from "@/lib/validators/venta";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = quickClienteSchema.parse(body);

    // Verificar si ya existe un cliente con el mismo email
    if (validatedData.email) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          userId,
          email: validatedData.email.toLowerCase()
        }
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: "Ya existe un cliente con este email" },
          { status: 400 }
        );
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: validatedData.nombre,
        telefono: validatedData.telefono || null,
        email: validatedData.email || null,
        userId,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente rápido:", error);
    
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