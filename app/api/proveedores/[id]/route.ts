import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log("QUe tiene el ID: ", id);

    const body = await req.json();

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email,
        direccion: body.direccion,
        descripcion: body.descripcion,
      },
    });

    return NextResponse.json(proveedorActualizado);
  } catch (error) {
    console.error("[PROVEEDOR_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const proveedorEliminado = await prisma.proveedor.delete({
      where: { id },
    });

    return NextResponse.json(proveedorEliminado);
  } catch (error) {
    console.error("[PROVEEDOR_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al eliminar proveedor" },
      { status: 500 }
    );
  }
}
