"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useVentasPorDia } from "@/lib/react-query/queries/ventas/useVentasPorDia";

interface Props {
  userId: string;
}

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "var(--primary)",
  },
};

export function ChartAreaInteractive({ userId }: Props) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  const dias = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const {
    data: chartData = [],
    isLoading,
    error,
  } = useVentasPorDia(userId, dias);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Ventas</CardTitle>
        <CardDescription>
          {timeRange === "7d"
            ? "Últimos 7 días"
            : timeRange === "30d"
            ? "Últimos 30 días"
            : "Últimos 3 Meses"}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 @[767px]/card:hidden" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-ventas)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-ventas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("es-UY", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string | number | undefined) =>
                    value !== undefined
                      ? new Date(value).toLocaleDateString("es-UY", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="ventas"
              type="natural"
              fill="url(#fillVentas)"
              stroke="var(--color-ventas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        {isLoading && (
          <p className="text-sm text-muted-foreground mt-2">
            Cargando datos...
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-2">Error al cargar ventas</p>
        )}
      </CardContent>
    </Card>
  );
}
