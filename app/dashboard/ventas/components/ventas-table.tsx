"use client";

import { useState, useMemo } from "react";
import { VentaWithDetails } from "@/types/venta";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
  SortingState,
  ColumnFiltersState,
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
  Plus,
  Eye,
  Trash2,
  Package,
  Briefcase,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useVentas } from "@/lib/react-query/queries/ventas/useVentas";
import { useEliminarVenta } from "@/lib/react-query/mutations/ventas/useEliminarVenta";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CustomColumnMeta {
  className?: string;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> extends CustomColumnMeta {}
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case "producto":
      return <Package className="h-4 w-4" />;
    case "servicio":
      return <Briefcase className="h-4 w-4" />;
    default:
      return (
        <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
      );
  }
};

const getTipoBadgeVariant = (
  tipo: string
): "default" | "secondary" | "outline" => {
  switch (tipo) {
    case "producto":
      return "default";
    case "servicio":
      return "secondary";
    default:
      return "outline";
  }
};

export function VentasTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState<VentaWithDetails | null>(
    null
  );

  const { data: ventas = [], isLoading } = useVentas();
  const eliminarVentaMutation = useEliminarVenta();

  const columns: ColumnDef<VentaWithDetails>[] = useMemo(
    () => [
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => {
          const fecha = new Date(row.getValue("fecha"));
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(fecha, "dd/MM/yyyy", { locale: es })}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ row }) => {
          const cliente = row.original.cliente;
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {cliente?.nombre || "Cliente general"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => {
          const tipo = row.getValue("tipo") as string;
          return (
            <div className="flex items-center gap-2">
              {getTipoIcon(tipo)}
              <Badge variant={getTipoBadgeVariant(tipo)}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const venta = row.original;
          const totalProductos = venta.VentaProducto.length;
          const totalServicios = venta.servicios.length;
          const totalItems = totalProductos + totalServicios;

          return (
            <div className="text-sm text-muted-foreground">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
              {totalProductos > 0 && totalServicios > 0 && (
                <div className="text-xs">
                  {totalProductos}P + {totalServicios}S
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "monto",
        header: "Monto",
        cell: ({ row }) => {
          const monto = row.getValue("monto") as number;
          return (
            <div className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>${monto.toLocaleString()}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Creada",
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <div className="text-sm text-muted-foreground">
              {format(date, "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/ventas/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVentaToDelete(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: {
          className: "w-[120px]",
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: ventas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDelete = async () => {
    if (!ventaToDelete) return;

    await eliminarVentaMutation.mutateAsync(ventaToDelete.id);
    setIsDeleteDialogOpen(false);
    setVentaToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar ventas..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
        <Button asChild>
          <Link href="/dashboard/ventas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay ventas registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <select
              value={`${table.getState().pagination.pageSize}`}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] border rounded px-2"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la primera página</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la página anterior</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la página siguiente</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la última página</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              venta
              {ventaToDelete?.cliente?.nombre && (
                <>
                  {" "}
                  de <strong>{ventaToDelete.cliente.nombre}</strong>
                </>
              )}{" "}
              de la base de datos.
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                ℹ️ El stock de los productos será restaurado automáticamente.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={eliminarVentaMutation.isPending}
            >
              {eliminarVentaMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
