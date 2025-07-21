import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    console.log("[PROVEEDOR_POST] Recibiendo solicitud...");

    const body = await req.json();
    console.log("[PROVEEDOR_POST] Datos recibidos:", body);

    if (!body.userId || !body.nombre) {
      console.warn("[PROVEEDOR_POST] userId o nombre faltante");
      return NextResponse.json(
        { error: "Faltan campos obligatorios: userId o nombre" },
        { status: 400 }
      );
    }

    const nuevoProveedor = await prisma.proveedor.create({
      data: {
        userId: body.userId,
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email,
        direccion: body.direccion,
        descripcion: body.descripcion,
      },
    });

    console.log(
      "[PROVEEDOR_POST] Proveedor creado correctamente:",
      nuevoProveedor
    );

    return NextResponse.json(nuevoProveedor);
  } catch (error) {
    console.error("[PROVEEDOR_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("[PROVEEDOR_GET] Recibiendo solicitud...");

  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    console.warn("[PROVEEDOR_GET] userId faltante en query");
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  console.log("[PROVEEDOR_GET] Buscando proveedores para userId:", userId);

  try {
    const proveedores = await prisma.proveedor.findMany({
      where: { userId },
      orderBy: { nombre: "asc" },
    });

    console.log("[PROVEEDOR_GET] Proveedores encontrados:", proveedores.length);
    return NextResponse.json(proveedores);
  } catch (error) {
    console.error("[PROVEEDOR_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
      { status: 500 }
    );
  }
}
