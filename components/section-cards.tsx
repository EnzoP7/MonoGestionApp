"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardData, DashboardData } from "@/lib/react-query/queries/dashboard/useDashboardData";
import { cn } from "@/lib/utils";

interface SectionCardsProps {
  userId: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend?: {
    value: number | null;
    label: string;
  };
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

function MetricCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  className,
  valueClassName 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend?.value) return <Minus className="w-4 h-4" />;
    return trend.value > 0 ? 
      <ArrowUpRight className="w-4 h-4" /> : 
      <ArrowDownRight className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend?.value) return "text-muted-foreground";
    return trend.value > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  };

  return (
    <Card className={cn(
      "border-0 shadow-lg hover:shadow-xl transition-all duration-300 group",
      "bg-gradient-to-br from-background via-background to-muted/20",
      "hover:scale-[1.02] transform-gpu",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-muted-foreground font-medium">
            {title}
          </CardDescription>
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
        </div>
        <CardTitle className={cn(
          "text-3xl font-bold tracking-tight",
          valueClassName
        )}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>
          {trend && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-2 py-1 text-xs font-medium border-0",
                  getTrendColor(),
                  trend.value !== null && trend.value > 0 
                    ? "bg-emerald-50 dark:bg-emerald-950/30" 
                    : trend.value !== null && trend.value < 0 
                    ? "bg-red-50 dark:bg-red-950/30"
                    : "bg-muted"
                )}
              >
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  {trend.value ? `${trend.value.toFixed(1)}%` : "Sin datos"}
                </div>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCards({ userId }: SectionCardsProps) {
  const { data, isLoading, error, refetch } = useDashboardData(userId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metrics = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: "Total Ingresos",
        value: formatCurrency(data.totalIngresos),
        description: "Ingresos y ventas acumulados este mes",
        trend: {
          value: data.growthRate,
          label: "vs mes anterior"
        },
        icon: <TrendingUp className="w-5 h-5" />,
        className: "border-l-4 border-emerald-500",
        valueClassName: "text-emerald-600 dark:text-emerald-400"
      },
      {
        title: "Total Egresos",
        value: formatCurrency(data.totalGastos),
        description: "Gastos y compras registrados este mes",
        icon: <TrendingDown className="w-5 h-5" />,
        className: "border-l-4 border-red-500", 
        valueClassName: "text-red-600 dark:text-red-400"
      },
      {
        title: "Balance Neto",
        value: formatCurrency(data.balance),
        description: data.balance >= 0 ? "Ganancia este mes" : "Pérdida este mes",
        icon: <DollarSign className="w-5 h-5" />,
        className: cn(
          "border-l-4",
          data.balance >= 0 ? "border-blue-500" : "border-orange-500"
        ),
        valueClassName: data.balance >= 0 
          ? "text-blue-600 dark:text-blue-400" 
          : "text-orange-600 dark:text-orange-400"
      },
      {
        title: "Productos Activos",
        value: data.productosActivos.toString(),
        description: "Productos disponibles en inventario",
        icon: <Package className="w-5 h-5" />,
        className: "border-l-4 border-purple-500",
        valueClassName: "text-purple-600 dark:text-purple-400"
      },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error al cargar datos del dashboard</p>
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
