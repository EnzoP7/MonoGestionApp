import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { userId: string };
}

// ✅ GET /api/compras/[userId]
export async function GET(req: NextRequest, { params }: Params) {
  const userId = params.userId;
  console.log("[GET_COMPRAS] userId recibido:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    const compras = await prisma.compra.findMany({
      where: { userId },
      include: {
        proveedor: true,
        productos: true, // 👈 importante
      },
      orderBy: { fecha: "desc" },
    });

    console.log("[GET_COMPRAS] Compras encontradas:", compras.length);
    return NextResponse.json(compras);
  } catch (error) {
    console.error("[GET_COMPRAS_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener compras" },
      { status: 500 }
    );
  }
}

// ✅ POST: Crear compra (con Egreso + Movimiento)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[POST_COMPRA] Body recibido:", body);

    const { userId, proveedorId, fecha, descripcion, productos } = body;

    if (
      !userId ||
      !fecha ||
      !Array.isArray(productos) ||
      productos.length === 0
    ) {
      console.warn("[POST_COMPRA_WARNING] Datos incompletos", {
        userId,
        fecha,
        productos,
      });
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const montoTotal = productos.reduce(
      (total: number, p: any) => total + p.precioUnitario * p.cantidad,
      0
    );

    console.log("[POST_COMPRA] Monto total calculado:", montoTotal);

    // ✅ Crear la compra
    const nuevaCompra = await prisma.compra.create({
      data: {
        user: { connect: { id: userId } },
        proveedor: proveedorId ? { connect: { id: proveedorId } } : undefined,
        fecha: new Date(fecha),
        descripcion,
        monto: montoTotal,
        productos: {
          create: productos.map((p: any) => ({
            producto: { connect: { id: p.productoId } },
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
          })),
        },
      },
    });

    console.log("[POST_COMPRA] Compra creada:", nuevaCompra.id);

    // ✅ Actualizar stock
    for (const p of productos) {
      await prisma.producto.update({
        where: { id: p.productoId },
        data: {
          cantidad: {
            increment: p.cantidad,
          },
        },
      });
    }

    // ✅ Crear egreso vinculado
    const nuevoEgreso = await prisma.egreso.create({
      data: {
        user: { connect: { id: userId } },
        fecha: new Date(fecha),
        monto: montoTotal,
        categoria: "Compra",
        descripcion,
        compraId: nuevaCompra.id,
      },
    });

    console.log("[POST_COMPRA] Egreso creado:", nuevoEgreso.id);

    // ✅ Crear movimiento vinculado a la compra
    const nuevoMovimiento = await prisma.movimiento.create({
      data: {
        user: { connect: { id: userId } },
        tipo: "Compra",
        fecha: new Date(fecha),
        monto: montoTotal,
        descripcion: descripcion ?? `Compra registrada`,
        compra: { connect: { id: nuevaCompra.id } },
      },
    });

    console.log("[POST_COMPRA] Movimiento creado:", nuevoMovimiento.id);

    return NextResponse.json(nuevaCompra);
  } catch (error) {
    console.error("[POST_COMPRA_ERROR]", error);
    return NextResponse.json(
      { error: "Error al crear compra" },
      { status: 500 }
    );
  }
}
