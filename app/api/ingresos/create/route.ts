import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { fecha, monto, descripcion, categoriaIngresoId } = body;

    if (!userId || !fecha || monto === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoIngreso = await prisma.$transaction(async (tx) => {
      // Crear el ingreso
      const ingreso = await tx.ingreso.create({
        data: {
          userId,
          fecha: new Date(fecha),
          monto,
          descripcion,
          categoriaIngresoId,
        },
        include: {
          categoriaIngreso: true,
        },
      });

      // Crear el movimiento automáticamente
      await tx.movimiento.create({
        data: {
          userId,
          tipo: "Ingreso",
          fecha: new Date(fecha),
          monto,
          descripcion: descripcion || `Ingreso - ${ingreso.categoriaIngreso?.nombre || 'Sin categoría'}`,
          ingresoId: ingreso.id,
        },
      });

      return ingreso;
    });

    return NextResponse.json(nuevoIngreso, { status: 201 });
  } catch (error) {
    console.error("[INGRESO_POST]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el ingreso." },
      { status: 500 }
    );
  }
}