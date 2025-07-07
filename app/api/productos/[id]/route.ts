// app/api/productos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

// ✅ Obtener un producto por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error("[PRODUCTO_GET]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al obtener el producto." },
      { status: 500 }
    );
  }
}

// ✅ Modificar producto
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { nombre, descripcion, precio, cantidad, activo, userId } = body;

    if (!userId || !params.id) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: params.id },
      data: {
        nombre,
        descripcion,
        precio,
        cantidad,
        activo,
      },
    });

    revalidateTag(`dashboard:${userId}`);

    return NextResponse.json(productoActualizado);
  } catch (error) {
    console.error("[PRODUCTO_PUT]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al modificar el producto." },
      { status: 500 }
    );
  }
}

// ✅ Eliminar producto
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const userId = searchParams.get("userId");

    if (!userId || !params.id) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const productoEliminado = await prisma.producto.delete({
      where: { id: params.id },
    });

    revalidateTag(`dashboard:${userId}`);

    return NextResponse.json(productoEliminado);
  } catch (error) {
    console.error("[PRODUCTO_DELETE]", error);
    return NextResponse.json(
      { error: "Ocurrió un error al eliminar el producto." },
      { status: 500 }
    );
  }
}
