import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const egresos = await prisma.egreso.findMany({
      where: { userId },
      include: {
        categoriaEgreso: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(egresos);
  } catch (error) {
    console.error("[GET_EGRESOS]", error);
    return NextResponse.json(
      { error: "Error al obtener los egresos" },
      { status: 500 }
    );
  }
}