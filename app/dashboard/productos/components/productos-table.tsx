"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Producto } from "@/types/producto";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
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
import { Eye, Pencil, Trash2 } from "lucide-react";
import { CreateProductoModal } from "./CreateProductoModal";
import { useProductos } from "@/lib/react-query/queries/useProductos";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEliminarProducto } from "@/lib/react-query/mutations/productos/useEliminarProducto";
import { EditProductoModal } from "./EditProductoModal";

export function ProductosTable({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: productos = [], isLoading, error } = useProductos(userId);

  const [globalFilter, setGlobalFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Estados para modal de edición:
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarProducto({
    userId,
  });

  const filteredData = useMemo(() => {
    return productos.filter((p) => {
      const matchesNombre = p.nombre
        .toLowerCase()
        .includes(globalFilter.toLowerCase());
      const matchesEstado =
        estadoFilter === "todos"
          ? true
          : estadoFilter === "activo"
          ? p.activo
          : !p.activo;
      return matchesNombre && matchesEstado;
    });
  }, [productos, globalFilter, estadoFilter]);

  const columns: ColumnDef<Producto>[] = [
    { accessorKey: "nombre", header: "Nombre" },
    {
      accessorKey: "precio",
      header: "Precio",
      cell: ({ row }) => <div>${row.original.precio.toFixed(2)}</div>,
    },
    { accessorKey: "cantidad", header: "Cantidad" },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "default" : "destructive"}>
          {row.original.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          {/* Ver */}
          <Link href={`/dashboard/productos/${row.original.id}?view=1`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4 text-primary" />
            </Button>
          </Link>

          {/* Editar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setProductoSeleccionado(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Eliminar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (
                confirm(
                  `¿Estás seguro de que quieres eliminar "${row.original.nombre}"?`
                )
              ) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <div className="p-4">Cargando productos...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error al cargar productos</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Productos</h2>
        <CreateProductoModal userId={userId} />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Buscar por nombre..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select onValueChange={setEstadoFilter} value={estadoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between py-2">
        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Modal de edición */}
      {productoSeleccionado && (
        <EditProductoModal
          userId={userId}
          producto={productoSeleccionado}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setProductoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}
