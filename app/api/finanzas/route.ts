import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

interface FinancialSummary {
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  transaccionesTotales: number;
  promedioIngresosMensual: number;
  promedioEgresosMensual: number;
  crecimientoMensual: number;
  categoryBreakdown: Array<{
    categoria: string;
    tipo: string;
    total: number;
    porcentaje: number;
    transacciones: number;
  }>;
  monthlyTrends: Array<{
    mes: string;
    ingresos: number;
    egresos: number;
    neto: number;
  }>;
  weeklyActivity: Array<{
    dia: string;
    ingresos: number;
    egresos: number;
  }>;
  topCategorias: Array<{
    nombre: string;
    tipo: string;
    total: number;
    porcentaje: number;
  }>;
  recentTransactions: Array<{
    id: string;
    tipo: string;
    monto: number;
    fecha: Date;
    descripcion?: string;
    categoria?: string;
  }>;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los movimientos del usuario
    const movimientos = await prisma.movimiento.findMany({
      where: { userId },
      include: {
        ingreso: {
          include: {
            categoriaIngreso: true,
          },
        },
        egreso: {
          include: {
            categoriaEgreso: true,
          },
        },
        compra: {
          include: {
            proveedor: true,
          },
        },
        venta: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    // Calcular totales básicos
    const totalIngresos = movimientos
      .filter(m => m.tipo === "Ingreso" || m.tipo === "Venta")
      .reduce((sum, m) => sum + m.monto, 0);

    const totalEgresos = movimientos
      .filter(m => m.tipo === "Egreso" || m.tipo === "Compra")
      .reduce((sum, m) => sum + m.monto, 0);

    const balanceNeto = totalIngresos - totalEgresos;

    // Calcular tendencias mensuales (últimos 12 meses)
    const now = new Date();
    const monthlyData = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthMovimientos = movimientos.filter(m => {
        const fecha = new Date(m.fecha);
        return fecha >= monthDate && fecha < nextMonth;
      });
      
      const monthIngresos = monthMovimientos
        .filter(m => m.tipo === "Ingreso" || m.tipo === "Venta")
        .reduce((sum, m) => sum + m.monto, 0);
      
      const monthEgresos = monthMovimientos
        .filter(m => m.tipo === "Egreso" || m.tipo === "Compra")
        .reduce((sum, m) => sum + m.monto, 0);
      
      monthlyData.push({
        mes: monthDate.toLocaleDateString("es-ES", { 
          month: "short", 
          year: "numeric" 
        }),
        ingresos: monthIngresos,
        egresos: monthEgresos,
        neto: monthIngresos - monthEgresos,
      });
    }

    // Calcular actividad semanal (últimos 7 días)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayMovimientos = movimientos.filter(m => {
        const fecha = new Date(m.fecha);
        return fecha >= dayDate && fecha < nextDay;
      });
      
      const dayIngresos = dayMovimientos
        .filter(m => m.tipo === "Ingreso" || m.tipo === "Venta")
        .reduce((sum, m) => sum + m.monto, 0);
      
      const dayEgresos = dayMovimientos
        .filter(m => m.tipo === "Egreso" || m.tipo === "Compra")
        .reduce((sum, m) => sum + m.monto, 0);
      
      weeklyData.push({
        dia: dayDate.toLocaleDateString("es-ES", { weekday: "short" }),
        ingresos: dayIngresos,
        egresos: dayEgresos,
      });
    }

    // Análisis por categorías
    const categoryMap = new Map();
    
    movimientos.forEach(m => {
      let categoria = "Sin categoría";
      let tipo = m.tipo;
      
      if (m.tipo === "Ingreso" && m.ingreso?.categoriaIngreso) {
        categoria = m.ingreso.categoriaIngreso.nombre;
      } else if (m.tipo === "Egreso" && m.egreso?.categoriaEgreso) {
        categoria = m.egreso.categoriaEgreso.nombre;
      } else if (m.tipo === "Egreso" && m.egreso?.categoria) {
        categoria = m.egreso.categoria;
      } else if (m.tipo === "Venta") {
        categoria = "Ventas";
        tipo = "Ingreso";
      } else if (m.tipo === "Compra") {
        categoria = "Compras";
        tipo = "Egreso";
      }
      
      const key = `${categoria}-${tipo}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoria,
          tipo,
          total: 0,
          transacciones: 0,
        });
      }
      
      const item = categoryMap.get(key);
      item.total += m.monto;
      item.transacciones += 1;
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map(item => ({
        ...item,
        porcentaje: totalIngresos + totalEgresos > 0 
          ? (item.total / (totalIngresos + totalEgresos)) * 100 
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Top 5 categorías
    const topCategorias = categoryBreakdown.slice(0, 5);

    // Calcular promedios y crecimiento
    const mesesConDatos = monthlyData.filter(m => m.ingresos > 0 || m.egresos > 0).length;
    const promedioIngresosMensual = mesesConDatos > 0 ? totalIngresos / mesesConDatos : 0;
    const promedioEgresosMensual = mesesConDatos > 0 ? totalEgresos / mesesConDatos : 0;
    
    // Crecimiento comparando últimos 2 meses
    const ultimoMes = monthlyData[monthlyData.length - 1];
    const mesAnterior = monthlyData[monthlyData.length - 2];
    const crecimientoMensual = mesAnterior && mesAnterior.neto !== 0
      ? ((ultimoMes.neto - mesAnterior.neto) / Math.abs(mesAnterior.neto)) * 100
      : 0;

    // Transacciones recientes (últimas 10)
    const recentTransactions = movimientos.slice(0, 10).map(m => ({
      id: m.id,
      tipo: m.tipo,
      monto: m.monto,
      fecha: m.fecha,
      descripcion: m.descripcion || undefined,
      categoria: m.ingreso?.categoriaIngreso?.nombre || 
                 m.egreso?.categoriaEgreso?.nombre || 
                 m.egreso?.categoria ||
                 (m.tipo === "Venta" ? "Ventas" : m.tipo === "Compra" ? "Compras" : "Sin categoría"),
    }));

    const summary: FinancialSummary = {
      totalIngresos,
      totalEgresos,
      balanceNeto,
      transaccionesTotales: movimientos.length,
      promedioIngresosMensual,
      promedioEgresosMensual,
      crecimientoMensual,
      categoryBreakdown,
      monthlyTrends: monthlyData,
      weeklyActivity: weeklyData,
      topCategorias,
      recentTransactions,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[GET_FINANZAS]", error);
    return NextResponse.json(
      { error: "Error al obtener datos financieros" },
      { status: 500 }
    );
  }
}