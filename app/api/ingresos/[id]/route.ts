import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function GET(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;

    if (!id) {
      return NextResponse.json({ error: "ID faltante." }, { status: 400 });
    }

    const ingreso = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        categoriaIngreso: true,
      },
    });

    if (!ingreso) {
      return NextResponse.json(
        { error: "Ingreso no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(ingreso);
  } catch (error) {
    console.error("[INGRESO_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener el ingreso." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;
    const body = await req.json();
    const { fecha, monto, descripcion, categoriaIngresoId } = body;
    const userId = await getCurrentUserId();

    if (!id || !fecha || monto === undefined || !userId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const ingresoActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar el ingreso
      const ingreso = await tx.ingreso.update({
        where: { id },
        data: { 
          fecha: new Date(fecha), 
          monto, 
          descripcion, 
          categoriaIngresoId 
        },
        include: {
          categoriaIngreso: true,
        },
      });

      // Buscar el movimiento existente para este ingreso
      const movimientoExistente = await tx.movimiento.findFirst({
        where: { ingresoId: id },
      });

      if (movimientoExistente) {
        // Actualizar el movimiento existente
        await tx.movimiento.update({
          where: { id: movimientoExistente.id },
          data: {
            fecha: new Date(fecha),
            monto,
            descripcion: descripcion || `Ingreso - ${ingreso.categoriaIngreso?.nombre || 'Sin categoría'}`,
          },
        });
      } else {
        // Crear nuevo movimiento si no existe (caso de ingresos creados antes de esta feature)
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
      }

      return ingreso;
    });

    return NextResponse.json(ingresoActualizado);
  } catch (error) {
    console.error("[INGRESO_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Error al modificar el ingreso." },
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

    const ingresoEliminado = await prisma.$transaction(async (tx) => {
      // Eliminar movimientos relacionados primero
      await tx.movimiento.deleteMany({
        where: { ingresoId: id },
      });

      // Luego eliminar el ingreso
      const ingreso = await tx.ingreso.delete({
        where: { id },
      });

      return ingreso;
    });

    return NextResponse.json(ingresoEliminado);
  } catch (error) {
    console.error("[INGRESO_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar el ingreso." },
      { status: 500 }
    );
  }
}