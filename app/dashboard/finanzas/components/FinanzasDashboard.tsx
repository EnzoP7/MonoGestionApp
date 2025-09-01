"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useFinanzas } from "@/lib/react-query/queries/finanzas/useFinanzas";
import { FinancialSummary } from "@/types/finanzas";
import Link from "next/link";

interface FinanzasDashboardProps {
  userId: string;
}

const COLORS = [
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F97316", // Orange
];

export function FinanzasDashboard({ userId }: FinanzasDashboardProps) {
  const { data: finanzas, isLoading, error, refetch } = useFinanzas(userId);
  const [timeRange, setTimeRange] = useState("12m");
  const [chartType, setChartType] = useState("area");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Cargando análisis financiero...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">
            Error al cargar datos financieros
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!finanzas) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Análisis Financiero
          </h1>
          <p className="text-muted-foreground mt-1">
            Dashboard completo de tu situación financiera
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>

          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Balance Neto */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Balance Neto
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatCurrency(finanzas.balanceNeto)}
              </span>
              <Target className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {finanzas.crecimientoMensual >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm opacity-90">
                {formatPercent(finanzas.crecimientoMensual)} vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Ingresos */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Ingresos
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatCurrency(finanzas.totalIngresos)}
              </span>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">
                Promedio mensual:{" "}
                {formatCurrency(finanzas.promedioIngresosMensual)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Egresos */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Egresos
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatCurrency(finanzas.totalEgresos)}
              </span>
              <TrendingDown className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">
                Promedio mensual:{" "}
                {formatCurrency(finanzas.promedioEgresosMensual)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transacciones Totales */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Transacciones
            </CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {finanzas.transaccionesTotales}
              </span>
              <Zap className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">
                Actividad financiera total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Tendencias Mensuales
                </CardTitle>
                <CardDescription>
                  Ingresos vs Egresos durante los últimos 12 meses
                </CardDescription>
              </div>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="line">Línea</SelectItem>
                  <SelectItem value="bar">Barras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={finanzas.monthlyTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="mes"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      stackId="1"
                      stroke={COLORS[1]}
                      fill={COLORS[1]}
                      fillOpacity={0.6}
                      name="Ingresos"
                    />
                    <Area
                      type="monotone"
                      dataKey="egresos"
                      stackId="2"
                      stroke={COLORS[4]}
                      fill={COLORS[4]}
                      fillOpacity={0.6}
                      name="Egresos"
                    />
                  </AreaChart>
                ) : chartType === "line" ? (
                  <LineChart data={finanzas.monthlyTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke={COLORS[1]}
                      strokeWidth={3}
                      name="Ingresos"
                      dot={{ fill: COLORS[1], strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="egresos"
                      stroke={COLORS[4]}
                      strokeWidth={3}
                      name="Egresos"
                      dot={{ fill: COLORS[4], strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="neto"
                      stroke={COLORS[6]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Balance Neto"
                      dot={{ fill: COLORS[6], strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={finanzas.monthlyTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="ingresos"
                      fill={COLORS[1]}
                      name="Ingresos"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="egresos"
                      fill={COLORS[4]}
                      name="Egresos"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Distribución por Categorías
            </CardTitle>
            <CardDescription>
              Top 8 categorías por volumen de transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={finanzas.categoryBreakdown.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {finanzas.categoryBreakdown
                      .slice(0, 8)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Total",
                    ]}
                    labelFormatter={(label) => `Categoría: ${label}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: "12px" }}>
                        {value}
                      </span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity and Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Actividad Semanal
            </CardTitle>
            <CardDescription>
              Movimientos financieros de los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finanzas.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="ingresos"
                    fill={COLORS[1]}
                    name="Ingresos"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="egresos"
                    fill={COLORS[4]}
                    name="Egresos"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Top Categorías
            </CardTitle>
            <CardDescription>
              Categorías con mayor movimiento financiero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {finanzas.topCategorias.map((categoria, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{categoria.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {categoria.tipo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(categoria.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {categoria.porcentaje.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Transacciones Recientes
              </CardTitle>
              <CardDescription>
                Últimas 10 transacciones registradas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/movimientos">Ver todas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {finanzas.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      transaction.tipo === "Ingreso" ||
                      transaction.tipo === "Venta"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {transaction.descripcion || "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {transaction.tipo}
                      </Badge>
                      <span>{transaction.categoria}</span>
                      <span>•</span>
                      <span>
                        {new Date(transaction.fecha).toLocaleDateString(
                          "es-ES"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`font-semibold ${
                    transaction.tipo === "Ingreso" ||
                    transaction.tipo === "Venta"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.tipo === "Ingreso" ||
                  transaction.tipo === "Venta"
                    ? "+"
                    : "-"}
                  {formatCurrency(transaction.monto)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
