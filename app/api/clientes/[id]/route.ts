import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { clienteSchema } from "@/lib/validators/cliente";

// GET - Obtener cliente específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        ventas: {
          orderBy: { fecha: "desc" },
          take: 10, // Últimas 10 ventas
        },
        _count: {
          select: { ventas: true }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = clienteSchema.parse(body);

    // Verificar que el cliente existe y pertenece al usuario
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingCliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro cliente con el mismo email (si se proporciona)
    if (validatedData.email && validatedData.email.trim() !== "") {
      const duplicateCliente = await prisma.cliente.findFirst({
        where: {
          userId,
          email: validatedData.email.toLowerCase(),
          NOT: { id: params.id }
        }
      });

      if (duplicateCliente) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con este email" },
          { status: 400 }
        );
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre: validatedData.nombre,
        telefono: validatedData.telefono || null,
        email: validatedData.email || null,
        direccion: validatedData.direccion || null,
      },
      include: {
        _count: {
          select: { ventas: true }
        }
      }
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el cliente existe y pertenece al usuario
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        _count: {
          select: { ventas: true }
        }
      }
    });

    if (!existingCliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el cliente tiene ventas asociadas
    if (existingCliente._count.ventas > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el cliente porque tiene ventas asociadas",
          details: `El cliente tiene ${existingCliente._count.ventas} venta(s) asociada(s)`
        },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}