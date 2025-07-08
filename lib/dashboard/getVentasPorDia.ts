import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function getVentasPorDia(userId: string, dias: number = 90) {
  const desde = subDays(new Date(), dias);

  const ventas = await prisma.venta.findMany({
    where: {
      userId,
      fecha: { gte: desde },
    },
    select: { fecha: true },
  });

  const grouped = ventas.reduce<Record<string, number>>((acc, venta) => {
    const fecha = format(venta.fecha, "yyyy-MM-dd");
    acc[fecha] = (acc[fecha] || 0) + 1;
    return acc;
  }, {});

  const result: { date: string; ventas: number }[] = [];
  for (let i = 0; i < dias; i++) {
    const date = format(subDays(new Date(), dias - i - 1), "yyyy-MM-dd");
    result.push({ date, ventas: grouped[date] || 0 });
  }

  return result;
}
