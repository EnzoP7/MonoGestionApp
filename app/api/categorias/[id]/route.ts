import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId, nombre, tipo, tipoCategoria, tipoCategoriaOriginal } =
      await request.json();

    if (
      !userId ||
      !nombre ||
      !tipo ||
      !tipoCategoria ||
      !tipoCategoriaOriginal
    ) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Si el tipo de categoría cambió, necesitamos mover el registro
    if (tipoCategoria !== tipoCategoriaOriginal) {
      // Obtener la categoría original
      let categoriaOriginal;

      if (tipoCategoriaOriginal === "Ingreso") {
        categoriaOriginal = await prisma.categoriaIngreso.findUnique({
          where: { id, userId },
        });
      } else {
        categoriaOriginal = await prisma.categoriaEgreso.findUnique({
          where: { id, userId },
        });
      }

      if (!categoriaOriginal) {
        return NextResponse.json(
          { error: "Categoría no encontrada" },
          { status: 404 }
        );
      }

      // Crear en la nueva tabla y eliminar de la original
      if (tipoCategoria === "Ingreso") {
        // Crear en CategoriaIngreso
        const nuevaCategoria = await prisma.categoriaIngreso.create({
          data: {
            userId,
            nombre,
            tipo,
          },
        });

        // Eliminar de CategoriaEgreso
        await prisma.categoriaEgreso.delete({
          where: { id },
        });

        return NextResponse.json(nuevaCategoria);
      } else {
        // Crear en CategoriaEgreso
        const nuevaCategoria = await prisma.categoriaEgreso.create({
          data: {
            userId,
            nombre,
            tipo,
          },
        });

        // Eliminar de CategoriaIngreso
        await prisma.categoriaIngreso.delete({
          where: { id },
        });

        return NextResponse.json(nuevaCategoria);
      }
    } else {
      // Actualizar en la misma tabla
      let categoriaActualizada;

      if (tipoCategoria === "Ingreso") {
        categoriaActualizada = await prisma.categoriaIngreso.update({
          where: { id, userId },
          data: {
            nombre,
            tipo,
          },
        });
      } else {
        categoriaActualizada = await prisma.categoriaEgreso.update({
          where: { id, userId },
          data: {
            nombre,
            tipo,
          },
        });
      }

      return NextResponse.json(categoriaActualizada);
    }
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId, tipoCategoria } = await request.json();

    if (!userId || !tipoCategoria) {
      return NextResponse.json(
        { error: "UserId y tipoCategoria son requeridos" },
        { status: 400 }
      );
    }

    if (tipoCategoria === "Ingreso") {
      // Verificar si la categoría está siendo usada
      const ingresosAsociados = await prisma.ingreso.count({
        where: { categoriaIngresoId: id },
      });

      if (ingresosAsociados > 0) {
        return NextResponse.json(
          {
            error: `No se puede eliminar la categoría porque tiene ${ingresosAsociados} ingresos asociados`,
          },
          { status: 400 }
        );
      }

      await prisma.categoriaIngreso.delete({
        where: { id, userId },
      });
    } else {
      // Verificar si la categoría está siendo usada
      const egresosAsociados = await prisma.egreso.count({
        where: { categoriaEgresoId: id },
      });

      if (egresosAsociados > 0) {
        return NextResponse.json(
          {
            error: `No se puede eliminar la categoría porque tiene ${egresosAsociados} egresos asociados`,
          },
          { status: 400 }
        );
      }

      await prisma.categoriaEgreso.delete({
        where: { id, userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
