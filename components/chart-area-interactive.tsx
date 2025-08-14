"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Loader2,
  AlertTriangle,
  RefreshCw 
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { useVentasPorDia } from "@/lib/react-query/queries/ventas/useVentasPorDia";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

interface ChartData {
  date: string;
  ventas: number;
}

export function ChartAreaInteractive({ userId }: Props) {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = React.useState("30d");

  const dias = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const {
    data: chartData = [],
    isLoading,
    error,
    refetch,
  } = useVentasPorDia(userId, dias);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalVentas = React.useMemo(() => {
    return chartData.reduce((sum: number, item: any) => sum + (item.ventas || 0), 0);
  }, [chartData]);

  const averageVentas = React.useMemo(() => {
    return chartData.length > 0 ? totalVentas / chartData.length : 0;
  }, [totalVentas, chartData.length]);

  const getGradientColors = () => {
    if (theme === "dark") {
      return {
        primary: "#3B82F6",
        primaryLight: "#60A5FA",
        primaryDark: "#1E40AF",
      };
    }
    return {
      primary: "hsl(var(--primary))",
      primaryLight: "hsl(var(--primary) / 0.8)",
      primaryDark: "hsl(var(--primary) / 1.2)",
    };
  };

  const colors = getGradientColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-foreground font-medium">
            {new Date(label).toLocaleDateString("es-AR", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-primary font-semibold">
            Ventas: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Análisis de Ventas
              </CardTitle>
              <CardDescription>Cargando datos de ventas...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Procesando datos de ventas...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error al cargar datos de ventas</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Error desconocido"}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Análisis de Ventas
            </CardTitle>
            <CardDescription>
              Evolución de ventas en el período seleccionado
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total del Período</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(totalVentas)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-muted">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio Diario</p>
              <p className="text-lg font-semibold">
                {formatCurrency(averageVentas)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === "dark" ? "#374151" : "#E5E7EB"}
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("es-AR", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <CustomTooltip />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke={colors.primary}
                strokeWidth={3}
                fill="url(#colorVentas)"
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">No hay datos de ventas</p>
            <p className="text-sm text-center">
              No se registraron ventas en el período seleccionado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
