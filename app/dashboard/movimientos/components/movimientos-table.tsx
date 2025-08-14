"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { 
  Calendar, 
  DollarSign, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Store,
  Filter,
  Search
} from "lucide-react";

import { useMovimientos } from "@/lib/react-query/queries/movimientos/useMovimientos";
import { Movimiento } from "@/types/movimiento";

interface CustomColumnMeta {
  className?: string;
}

export function MovimientosTable({ userId }: { userId: string }) {
  const { data: movimientos = [], isLoading, error } = useMovimientos(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const filteredData = useMemo(() => {
    return movimientos.filter((movimiento: Movimiento) => {
      // Filtro por tipo
      const matchesTipo = tipoFilter === "todos" || movimiento.tipo === tipoFilter;

      // Filtro por fecha
      const fecha = new Date(movimiento.fecha);
      const matchesFechaDesde = !fechaDesde || fecha >= new Date(fechaDesde);
      const matchesFechaHasta = !fechaHasta || fecha <= new Date(fechaHasta);

      // Filtro por texto (busca en descripción y fuentes relacionadas)
      const text = filterText.trim().toLowerCase();
      const matchesText = !text || 
        movimiento.descripcion?.toLowerCase().includes(text) ||
        movimiento.tipo.toLowerCase().includes(text) ||
        movimiento.monto.toString().includes(text) ||
        // Búsqueda en datos relacionados
        movimiento.ingreso?.categoriaIngreso?.nombre.toLowerCase().includes(text) ||
        movimiento.egreso?.categoria.toLowerCase().includes(text) ||
        movimiento.egreso?.categoriaEgreso?.nombre.toLowerCase().includes(text) ||
        movimiento.compra?.proveedor?.nombre.toLowerCase().includes(text) ||
        movimiento.venta?.cliente?.nombre.toLowerCase().includes(text);

      return matchesTipo && matchesFechaDesde && matchesFechaHasta && matchesText;
    });
  }, [movimientos, tipoFilter, fechaDesde, fechaHasta, filterText]);

  const resumen = useMemo(() => {
    const ingresos = filteredData.filter((m: Movimiento) => m.tipo === "Ingreso").reduce((sum: number, m: Movimiento) => sum + m.monto, 0);
    const egresos = filteredData.filter((m: Movimiento) => m.tipo === "Egreso").reduce((sum: number, m: Movimiento) => sum + m.monto, 0);
    const ventas = filteredData.filter((m: Movimiento) => m.tipo === "Venta").reduce((sum: number, m: Movimiento) => sum + m.monto, 0);
    const compras = filteredData.filter((m: Movimiento) => m.tipo === "Compra").reduce((sum: number, m: Movimiento) => sum + m.monto, 0);
    
    return {
      ingresos: ingresos + ventas,
      egresos: egresos + compras,
      neto: (ingresos + ventas) - (egresos + compras),
      total: filteredData.length
    };
  }, [filteredData]);

  const getSourceInfo = (movimiento: Movimiento) => {
    switch (movimiento.tipo) {
      case "Ingreso":
        return {
          source: "Ingreso directo",
          category: movimiento.ingreso?.categoriaIngreso?.nombre || "Sin categoría",
          detail: movimiento.ingreso?.descripcion
        };
      case "Egreso":
        return {
          source: "Egreso directo",
          category: movimiento.egreso?.categoriaEgreso?.nombre || movimiento.egreso?.categoria || "Sin categoría",
          detail: movimiento.egreso?.descripcion
        };
      case "Venta":
        return {
          source: "Venta",
          category: movimiento.venta?.cliente?.nombre || "Cliente no especificado",
          detail: `Tipo: ${movimiento.venta?.tipo || "No especificado"}`
        };
      case "Compra":
        return {
          source: "Compra",
          category: movimiento.compra?.proveedor?.nombre || "Proveedor no especificado",
          detail: movimiento.compra?.descripcion
        };
      default:
        return {
          source: "Desconocido",
          category: "N/A",
          detail: undefined
        };
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "Ingreso":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "Egreso":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "Venta":
        return <Store className="w-4 h-4 text-blue-600" />;
      case "Compra":
        return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (tipo: string, monto: number) => {
    switch (tipo) {
      case "Ingreso":
      case "Venta":
        return "text-green-600";
      case "Egreso":
      case "Compra":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const columns: ColumnDef<Movimiento>[] = [
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>
            {new Date(row.original.fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      ),
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const sourceInfo = getSourceInfo(row.original);
        return (
          <div className="flex items-center gap-2">
            {getTypeIcon(row.original.tipo)}
            <div className="flex flex-col">
              <Badge 
                variant={row.original.tipo === "Ingreso" || row.original.tipo === "Venta" ? "default" : "destructive"}
                className="w-fit"
              >
                {row.original.tipo}
              </Badge>
              <span className="text-xs text-muted-foreground mt-1">
                {sourceInfo.source}
              </span>
            </div>
          </div>
        );
      },
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "monto",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Monto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="w-4 h-4" />
          <span className={getTypeColor(row.original.tipo, row.original.monto)}>
            {row.original.tipo === "Egreso" || row.original.tipo === "Compra" ? "-" : "+"}
            ${row.original.monto.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "categoria",
      header: "Categoría/Origen",
      cell: ({ row }) => {
        const sourceInfo = getSourceInfo(row.original);
        return (
          <div className="max-w-[200px]">
            <div className="font-medium text-sm truncate" title={sourceInfo.category}>
              {sourceInfo.category}
            </div>
            {sourceInfo.detail && (
              <div className="text-xs text-muted-foreground truncate mt-1" title={sourceInfo.detail}>
                {sourceInfo.detail}
              </div>
            )}
          </div>
        );
      },
      meta: { className: "text-left hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[250px] truncate" title={row.original.descripcion || ""}>
          {row.original.descripcion || "-"}
        </div>
      ),
      meta: { className: "text-left hidden md:table-cell" } as CustomColumnMeta,
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (isLoading) return <div className="p-4">Cargando movimientos...</div>;
  if (error) return <div className="p-4 text-red-500">Error al cargar movimientos</div>;

  return (
    <div className="space-y-6 px-4">
      {/* Header y Resumen */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Movimientos</h2>
          <p className="text-sm text-muted-foreground">
            Historial completo de transacciones ({resumen.total} registros)
          </p>
        </div>
        
        {/* Resumen Financiero */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Ingresos</p>
                <p className="text-lg font-bold text-green-600">
                  ${resumen.ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Egresos</p>
                <p className="text-lg font-bold text-red-600">
                  ${resumen.egresos.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            resumen.neto >= 0 
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
              : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
          }`}>
            <div className="flex items-center gap-2">
              <DollarSign className={`w-5 h-5 ${resumen.neto >= 0 ? "text-blue-600" : "text-orange-600"}`} />
              <div>
                <p className={`text-sm font-medium ${
                  resumen.neto >= 0 
                    ? "text-blue-800 dark:text-blue-200" 
                    : "text-orange-800 dark:text-orange-200"
                }`}>
                  Balance Neto
                </p>
                <p className={`text-lg font-bold ${resumen.neto >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  {resumen.neto >= 0 ? "+" : ""}${resumen.neto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Filtrado</p>
                <p className="text-lg font-bold text-gray-600">
                  {resumen.total} mov.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en descripción, categoría, cliente..."
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select onValueChange={setTipoFilter} value={tipoFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="Ingreso">Ingresos</SelectItem>
            <SelectItem value="Egreso">Egresos</SelectItem>
            <SelectItem value="Venta">Ventas</SelectItem>
            <SelectItem value="Compra">Compras</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="Desde"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />

        <Input
          type="date"
          placeholder="Hasta"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as CustomColumnMeta)
                        ?.className || "text-center"
                    }
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        (cell.column.columnDef.meta as CustomColumnMeta)
                          ?.className || "text-center"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No se encontraron movimientos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {filteredData.length} movimientos
          (Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()})
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            Primera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Última
          </Button>
        </div>
      </div>
    </div>
  );
}