// app/api/dashboard/ventas/route.ts
import { getVentasPorDia } from "@/lib/dashboard/sales";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const dias = parseInt(searchParams.get("dias") || "90");

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const data = await getVentasPorDia(userId, dias);
  return NextResponse.json(data);
}
