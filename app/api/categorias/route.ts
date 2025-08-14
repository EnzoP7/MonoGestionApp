import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todas las categorías (Ingreso y Egreso)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "UserId es requerido" },
        { status: 400 }
      );
    }

    // Obtener ambos tipos de categorías en paralelo
    const [categoriasIngreso, categoriasEgreso] = await Promise.all([
      prisma.categoriaIngreso.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.categoriaEgreso.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      categoriasIngreso,
      categoriasEgreso,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const { userId, nombre, tipo, tipoCategoria } = await request.json();

    if (!userId || !nombre || !tipo || !tipoCategoria) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (!["Ingreso", "Egreso"].includes(tipoCategoria)) {
      return NextResponse.json(
        { error: "tipoCategoria debe ser 'Ingreso' o 'Egreso'" },
        { status: 400 }
      );
    }

    let nuevaCategoria;

    if (tipoCategoria === "Ingreso") {
      nuevaCategoria = await prisma.categoriaIngreso.create({
        data: {
          userId,
          nombre,
          tipo,
        },
      });
    } else {
      nuevaCategoria = await prisma.categoriaEgreso.create({
        data: {
          userId,
          nombre,
          tipo,
        },
      });
    }

    return NextResponse.json(nuevaCategoria, { status: 201 });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
