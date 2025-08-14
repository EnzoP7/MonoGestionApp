export interface FinancialSummary {
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  transaccionesTotales: number;
  promedioIngresosMensual: number;
  promedioEgresosMensual: number;
  crecimientoMensual: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  weeklyActivity: WeeklyActivity[];
  topCategorias: TopCategory[];
  recentTransactions: RecentTransaction[];
}

export interface CategoryBreakdown {
  categoria: string;
  tipo: string;
  total: number;
  porcentaje: number;
  transacciones: number;
}

export interface MonthlyTrend {
  mes: string;
  ingresos: number;
  egresos: number;
  neto: number;
}

export interface WeeklyActivity {
  dia: string;
  ingresos: number;
  egresos: number;
}

export interface TopCategory {
  nombre: string;
  tipo: string;
  total: number;
  porcentaje: number;
}

export interface RecentTransaction {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  descripcion?: string;
  categoria?: string;
}