"use client";

import {
  IconTrendingDown,
  IconTrendingUp,
  IconBox,
  IconCurrencyDollar,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardData } from "@/lib/react-query/queries/dashboard/useDashboardData";

interface SectionCardsProps {
  userId: string;
}

export function SectionCards({ userId }: SectionCardsProps) {
  const { data, isLoading, error } = useDashboardData(userId);

  if (isLoading) return <div className="p-4">Cargando datos...</div>;
  if (error || !data)
    return (
      <div className="p-4 text-red-500">
        Error al cargar datos del dashboard
      </div>
    );

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* INGRESOS */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Ingresos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${data.totalIngresos.toFixed(2)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {data.growthRate !== null
                ? `${data.growthRate.toFixed(1)}%`
                : "N/A"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            {data.growthRate === null
              ? "Sin datos del mes anterior"
              : data.growthRate > 0
              ? "Mejora frente al mes pasado"
              : "Bajó respecto al mes pasado"}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total declarado por ventas e ingresos
          </div>
        </CardFooter>
      </Card>

      {/* EGRESOS */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Egresos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${data.totalGastos.toFixed(2)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Gastos registrados este mes
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Incluye compras y otros egresos
          </div>
        </CardFooter>
      </Card>

      {/* INVENTARIO */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Inventario Activo</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.productosActivos}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBox className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Productos disponibles</div>
          <div className="text-muted-foreground">
            Solo productos con stock activo
          </div>
        </CardFooter>
      </Card>

      {/* BALANCE */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Balance Neto</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${data.balance.toFixed(2)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCurrencyDollar />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            {data.balance >= 0 ? "Ganancia este mes" : "Pérdida este mes"}
          </div>
          <div className="text-muted-foreground">
            Diferencia entre ingresos y egresos
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
