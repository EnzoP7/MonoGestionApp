import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function GET(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;

    if (!id) {
      return NextResponse.json({ error: "ID faltante." }, { status: 400 });
    }

    const egreso = await prisma.egreso.findUnique({
      where: { id },
      include: {
        categoriaEgreso: true,
      },
    });

    if (!egreso) {
      return NextResponse.json(
        { error: "Egreso no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(egreso);
  } catch (error) {
    console.error("[EGRESO_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener el egreso." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;
    const body = await req.json();
    const { fecha, monto, categoria, descripcion, categoriaEgresoId } = body;
    const userId = await getCurrentUserId();

    if (!id || !fecha || monto === undefined || !categoria || !userId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const egresoActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar el egreso
      const egreso = await tx.egreso.update({
        where: { id },
        data: { 
          fecha: new Date(fecha), 
          monto, 
          categoria,
          descripcion, 
          categoriaEgresoId 
        },
        include: {
          categoriaEgreso: true,
        },
      });

      // Buscar el movimiento existente para este egreso
      const movimientoExistente = await tx.movimiento.findFirst({
        where: { egresoId: id },
      });

      if (movimientoExistente) {
        // Actualizar el movimiento existente
        await tx.movimiento.update({
          where: { id: movimientoExistente.id },
          data: {
            fecha: new Date(fecha),
            monto,
            descripcion: descripcion || `Egreso - ${egreso.categoriaEgreso?.nombre || categoria}`,
          },
        });
      } else {
        // Crear nuevo movimiento si no existe (caso de egresos creados antes de esta feature)
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
      }

      return egreso;
    });

    return NextResponse.json(egresoActualizado);
  } catch (error) {
    console.error("[EGRESO_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Error al modificar el egreso." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const egresoEliminado = await prisma.$transaction(async (tx) => {
      // Eliminar movimientos relacionados primero
      await tx.movimiento.deleteMany({
        where: { egresoId: id },
      });

      // Luego eliminar el egreso
      const egreso = await tx.egreso.delete({
        where: { id },
      });

      return egreso;
    });

    return NextResponse.json(egresoEliminado);
  } catch (error) {
    console.error("[EGRESO_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar el egreso." },
      { status: 500 }
    );
  }
}