import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const movimientos = await prisma.movimiento.findMany({
      where: { userId },
      include: {
        ingreso: {
          include: {
            categoriaIngreso: true,
          },
        },
        egreso: {
          include: {
            categoriaEgreso: true,
          },
        },
        compra: {
          include: {
            proveedor: true,
          },
        },
        venta: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("[GET_MOVIMIENTOS]", error);
    return NextResponse.json(
      { error: "Error al obtener los movimientos" },
      { status: 500 }
    );
  }
}