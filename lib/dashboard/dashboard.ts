// lib/dashboard/getUserDashboardData.ts
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getUserDashboardData(userId: string) {
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);
  const startOfLastMonth = startOfMonth(subMonths(now, 1));
  const endOfLastMonth = endOfMonth(subMonths(now, 1));

  const [
    ingresosActual,
    ingresosPasado,
    ventasActuales,
    ventasPasadas,
    egresosActual,
    productosActivos,
  ] = await Promise.all([
    prisma.ingreso.aggregate({
      _sum: { monto: true },
      where: {
        userId,
        fecha: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
    }),
    prisma.ingreso.aggregate({
      _sum: { monto: true },
      where: {
        userId,
        fecha: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.venta.findMany({
      where: {
        userId,
        fecha: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
      include: { servicios: true },
    }),
    prisma.venta.findMany({
      where: {
        userId,
        fecha: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      include: { servicios: true },
    }),
    prisma.egreso.aggregate({
      _sum: { monto: true },
      where: {
        userId,
        fecha: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
    }),
    prisma.producto.count({
      where: {
        userId,
        activo: true,
      },
    }),
  ]);

  const ingresosPorVentaActual = ventasActuales.reduce((total, venta) => {
    const ventaTotal = venta.servicios.reduce(
      (sub, s) => sub + s.precio * s.cantidad,
      0
    );
    return total + ventaTotal;
  }, 0);

  const ingresosPorVentaAnterior = ventasPasadas.reduce((total, venta) => {
    const ventaTotal = venta.servicios.reduce(
      (sub, s) => sub + s.precio * s.cantidad,
      0
    );
    return total + ventaTotal;
  }, 0);

  const totalIngresos =
    (ingresosActual._sum.monto || 0) + ingresosPorVentaActual;

  const totalGastos = egresosActual._sum.monto || 0;
  const balance = totalIngresos - totalGastos;

  const growthRate =
    ingresosPorVentaAnterior === 0
      ? null
      : ((ingresosPorVentaActual - ingresosPorVentaAnterior) /
          ingresosPorVentaAnterior) *
        100;

  return {
    totalIngresos,
    totalGastos,
    productosActivos,
    balance,
    growthRate,
    cantidadVentas: ventasActuales.length,
  };
}
