import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { nombre, descripcion, precio, cantidad, activo } = body;

    if (!userId || !nombre || precio === undefined || cantidad === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        userId,
        nombre,
        descripcion,
        precio,
        cantidad,
        activo,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("[PRODUCTO_POST]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el producto." },
      { status: 500 }
    );
  }
}
