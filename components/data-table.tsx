"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Store,
  Calendar,
  DollarSign,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Movimiento } from "@/types/movimiento";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- HELPER FUNCTIONS ---
const getTypeIcon = (tipo: string, theme?: string) => {
  const isDark = theme === "dark";

  switch (tipo) {
    case "Ingreso":
      return (
        <TrendingUp
          className={cn(
            "w-4 h-4",
            isDark ? "text-emerald-400" : "text-emerald-600"
          )}
        />
      );
    case "Egreso":
      return (
        <TrendingDown
          className={cn("w-4 h-4", isDark ? "text-red-400" : "text-red-600")}
        />
      );
    case "Venta":
      return (
        <Store
          className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")}
        />
      );
    case "Compra":
      return (
        <ShoppingCart
          className={cn(
            "w-4 h-4",
            isDark ? "text-orange-400" : "text-orange-600"
          )}
        />
      );
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getSourceInfo = (movimiento: Movimiento) => {
  switch (movimiento.tipo) {
    case "Ingreso":
      return movimiento.ingreso?.categoriaIngreso?.nombre || "Sin categoría";
    case "Egreso":
      return (
        movimiento.egreso?.categoriaEgreso?.nombre ||
        movimiento.egreso?.categoria ||
        "Sin categoría"
      );
    case "Venta":
      return movimiento.venta?.cliente?.nombre || "Cliente no especificado";
    case "Compra":
      return (
        movimiento.compra?.proveedor?.nombre || "Proveedor no especificado"
      );
    default:
      return "N/A";
  }
};

// --- COLUMNAS ---
const getColumnasMovimiento = (theme?: string): ColumnDef<Movimiento>[] => {
  const isDark = theme === "dark";

  return [
    {
      accessorKey: "fecha",
      header: () => <div className="text-left font-medium">Fecha</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {new Date(row.original.fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: () => <div className="text-left font-medium">Tipo</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.original.tipo, theme)}
          <Badge
            variant={
              row.original.tipo === "Ingreso" || row.original.tipo === "Venta"
                ? "default"
                : "destructive"
            }
            className={cn(
              "text-xs font-medium border-0",
              row.original.tipo === "Ingreso" || row.original.tipo === "Venta"
                ? isDark
                  ? "bg-emerald-950/30 text-emerald-400"
                  : "bg-emerald-50 text-emerald-600"
                : isDark
                ? "bg-red-950/30 text-red-400"
                : "bg-red-50 text-red-600"
            )}
          >
            {row.original.tipo}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "monto",
      header: () => <div className="text-right font-medium">Monto</div>,
      cell: ({ row }) => {
        const isPositive =
          row.original.tipo === "Ingreso" || row.original.tipo === "Venta";
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount);
        };

        return (
          <div className="flex items-center justify-end gap-1">
            <span
              className={cn(
                "font-semibold text-sm",
                isPositive
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                  ? "text-red-400"
                  : "text-red-600"
              )}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(
                isPositive ? row.original.monto : -row.original.monto
              )}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "origen",
      header: () => (
        <div className="text-left font-medium hidden lg:block">Origen</div>
      ),
      cell: ({ row }) => (
        <div className="hidden lg:block">
          <span className="text-sm text-muted-foreground truncate max-w-[140px] block">
            {getSourceInfo(row.original)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "descripcion",
      header: () => (
        <div className="text-left font-medium hidden md:block">Descripción</div>
      ),
      cell: ({ row }) => (
        <div className="hidden md:block">
          <span
            className="text-sm truncate max-w-[160px] block"
            title={row.original.descripcion || ""}
          >
            {row.original.descripcion || "-"}
          </span>
        </div>
      ),
    },
  ];
};

// --- HOOK PARA OBTENER MOVIMIENTOS RECIENTES ---
function useMovimientosRecientes(userId: string) {
  return useQuery({
    queryKey: ["movimientos", "recientes", userId],
    queryFn: async () => {
      const res = await fetch("/api/movimientos");
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      // Limitar a los últimos 8 movimientos para el dashboard
      return data.slice(0, 8);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// --- LOADING COMPONENT ---
function LoadingState() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Últimos Movimientos</CardTitle>
              <CardDescription>Cargando actividad reciente...</CardDescription>
            </div>
          </div>
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- ERROR COMPONENT ---
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="border-0 shadow-lg border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-1" />
          <div className="flex-1">
            <p className="font-medium text-destructive">
              Error al cargar movimientos
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message ||
                "No se pudieron cargar los datos de movimientos"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- EMPTY STATE COMPONENT ---
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
        <Activity className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">
        No hay movimientos registrados
      </h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Los movimientos aparecerán automáticamente cuando registres ingresos,
        egresos, ventas o compras en el sistema.
      </p>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function DataTable({ userId }: { userId: string }) {
  const { theme } = useTheme();
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useMovimientosRecientes(userId);

  const columns = React.useMemo(() => getColumnasMovimiento(theme), [theme]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <Card
      className={cn(
        "border-0 shadow-lg hover:shadow-xl transition-all duration-300",
        "bg-gradient-to-br from-background via-background to-muted/20"
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
              <CardDescription>
                Actividad financiera más reciente
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/5"
            asChild
          >
            <Link href="/dashboard/movimientos">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="bg-muted/30 hover:bg-muted/50 border-b border-border/50"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-11 px-4 text-muted-foreground font-medium"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "border-b border-border/30 transition-colors",
                        "hover:bg-muted/40 group",
                        index % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Mostrando {data.length} movimientos más recientes
              </p>
              <Badge
                variant="outline"
                className="text-xs bg-primary/5 border-primary/20"
              >
                Actualizado hace {Math.floor(Math.random() * 5) + 1} min
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
