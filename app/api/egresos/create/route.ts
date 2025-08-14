import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { fecha, monto, categoria, descripcion, categoriaEgresoId } = body;

    if (!userId || !fecha || monto === undefined || !categoria) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoEgreso = await prisma.$transaction(async (tx) => {
      // Crear el egreso
      const egreso = await tx.egreso.create({
        data: {
          userId,
          fecha: new Date(fecha),
          monto,
          categoria,
          descripcion,
          categoriaEgresoId,
        },
        include: {
          categoriaEgreso: true,
        },
      });

      // Crear el movimiento automáticamente
      await tx.movimiento.create({
        data: {
          userId,
          tipo: "Egreso",
          fecha: new Date(fecha),
          monto,
          descripcion: descripcion || `Egreso - ${egreso.categoriaEgreso?.nombre || categoria}`,
          egresoId: egreso.id,
        },
      });

      return egreso;
    });

    return NextResponse.json(nuevoEgreso, { status: 201 });
  } catch (error) {
    console.error("[EGRESO_POST]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el egreso." },
      { status: 500 }
    );
  }
}