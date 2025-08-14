import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ingresos = await prisma.ingreso.findMany({
      where: { userId },
      include: {
        categoriaIngreso: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ingresos);
  } catch (error) {
    console.error("[GET_INGRESOS]", error);
    return NextResponse.json(
      { error: "Error al obtener los ingresos" },
      { status: 500 }
    );
  }
}