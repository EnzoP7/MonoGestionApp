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
import { useEliminarProducto } from "@/lib/react-query/mutations/productos/useEliminarProducto";
import { EditProductoModal } from "./EditProductoModal";
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

// Definir interfaz personalizada para meta
interface CustomColumnMeta {
  className?: string;
}

export function ProductosTable({ userId }: { userId: string }) {
  const { data: productos = [], isLoading, error } = useProductos(userId);

  const [filterField, setFilterField] = useState("nombre");
  const [filterText, setFilterText] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarProducto({ userId });

  const filteredData = useMemo(() => {
    return productos.filter((p) => {
      const matchesEstado =
        estadoFilter === "todos"
          ? true
          : estadoFilter === "activo"
          ? p.activo
          : !p.activo;

      const text = filterText.trim().toLowerCase();

      const matchesCampo = (() => {
        if (!text) return true;
        if (filterField === "nombre") {
          return p.nombre.toLowerCase().includes(text);
        } else if (filterField === "precio") {
          const val = parseFloat(text);
          return !isNaN(val) && p.precio >= val;
        } else if (filterField === "cantidad") {
          const val = parseInt(text);
          return !isNaN(val) && p.cantidad >= val;
        }
        return true;
      })();

      return matchesEstado && matchesCampo;
    });
  }, [productos, estadoFilter, filterField, filterText]);

  const columns: ColumnDef<Producto>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "precio",
      header: "Precio",
      cell: ({ row }) => <div>${row.original.precio.toFixed(2)}</div>,
      meta: {
        className: "text-center hidden sm:table-cell",
      } as CustomColumnMeta,
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "default" : "destructive"}>
          {row.original.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
      meta: {
        className: "text-center hidden sm:table-cell",
      } as CustomColumnMeta,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Link href={`/dashboard/productos/${row.original.id}?view=1`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4 text-primary" />
            </Button>
          </Link>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setProductoAEliminar(row.original);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
      meta: { className: "text-center" } as CustomColumnMeta,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Productos</h2>
        <CreateProductoModal userId={userId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Select onValueChange={setFilterField} value={filterField}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Nombre</SelectItem>
            <SelectItem value="precio">Precio</SelectItem>
            <SelectItem value="cantidad">Cantidad</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={
            filterField === "nombre"
              ? "Buscar..."
              : filterField === "precio"
              ? "Precio mínimo"
              : "Cantidad mínima"
          }
          type={filterField === "nombre" ? "text" : "number"}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full"
        />

        <Select onValueChange={setEstadoFilter} value={estadoFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
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

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar este producto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto{" "}
              <strong>{productoAEliminar?.nombre}</strong> será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProductoAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (productoAEliminar) {
                  deleteMutation.mutate(productoAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setProductoAEliminar(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
