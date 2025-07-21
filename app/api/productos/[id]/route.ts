import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: Obtener un producto
export async function GET(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;
    console.log("[PRODUCTO_GET] Buscando producto con ID:", id);

    if (!id) {
      return NextResponse.json({ error: "ID faltante." }, { status: 400 });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      console.warn("[PRODUCTO_GET] Producto no encontrado:", id);
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    console.log("[PRODUCTO_GET] Producto encontrado:", producto);
    return NextResponse.json(producto);
  } catch (error) {
    console.error("[PRODUCTO_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener el producto." },
      { status: 500 }
    );
  }
}

// ✅ PUT: Modificar un producto
export async function PUT(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;
    const body = await req.json();
    const { nombre, descripcion, precio, cantidad, activo, userId } = body;

    console.log("[PRODUCTO_PUT] ID:", id, "Body:", body);

    if (!id || !userId || !nombre || !precio || !cantidad) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: { nombre, descripcion, precio, cantidad, activo },
    });

    console.log("[PRODUCTO_PUT] Producto actualizado:", productoActualizado);
    return NextResponse.json(productoActualizado);
  } catch (error) {
    console.error("[PRODUCTO_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Error al modificar el producto." },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Eliminar un producto
export async function DELETE(req: NextRequest, context: any) {
  try {
    const id = (await context.params).id;

    console.log("[PRODUCTO_DELETE] ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const productoEliminado = await prisma.producto.delete({
      where: { id },
    });

    console.log("[PRODUCTO_DELETE] Producto eliminado:", productoEliminado);
    return NextResponse.json(productoEliminado);
  } catch (error) {
    console.error("[PRODUCTO_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto." },
      { status: 500 }
    );
  }
}
