"use client";

import { useState, useMemo } from "react";
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
import { Pencil, Trash2, Calendar } from "lucide-react";

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
import { useEliminarCategoria } from "@/lib/react-query/queries/categorias/useEliminarCategoria";
import { useCategorias } from "@/lib/react-query/queries/categorias/useCategorias";
import { CreateCategoriaModal } from "./CreateCategoriaModal";
import { EditCategoriaModal } from "./EditCategoriaModal";

// Definir interfaz personalizada para meta
interface CustomColumnMeta {
  className?: string;
}

// Tipo unificado para ambas categorías
interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
  tipoCategoria: "Ingreso" | "Egreso"; // Para distinguir en el cliente
}

export function CategoriasTable({ userId }: { userId: string }) {
  const { data: categorias = [], isLoading, error } = useCategorias(userId);

  const [filterField, setFilterField] = useState("nombre");
  const [filterText, setFilterText] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");

  const [categoriaAEliminar, setCategoriaAEliminar] =
    useState<Categoria | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarCategoria({ userId });

  const filteredData = useMemo(() => {
    return categorias.filter((c) => {
      const matchesTipo =
        tipoFilter === "todos"
          ? true
          : tipoFilter === "ingreso"
          ? c.tipoCategoria === "Ingreso"
          : c.tipoCategoria === "Egreso";

      const text = filterText.trim().toLowerCase();

      const matchesCampo = (() => {
        if (!text) return true;
        if (filterField === "nombre") {
          return c.nombre.toLowerCase().includes(text);
        } else if (filterField === "tipo") {
          return c.tipo.toLowerCase().includes(text);
        }
        return true;
      })();

      return matchesTipo && matchesCampo;
    });
  }, [categorias, tipoFilter, filterField, filterText]);

  const columns: ColumnDef<Categoria>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "tipoCategoria",
      header: "Categoría",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.tipoCategoria === "Ingreso" ? "default" : "secondary"
          }
        >
          {row.original.tipoCategoria}
        </Badge>
      ),
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "createdAt",
      header: "Fecha Creación",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>
            {new Date(row.original.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCategoriaSeleccionada(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCategoriaAEliminar(row.original);
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

  if (isLoading) return <div className="p-4">Cargando categorías...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error al cargar categorías</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Categorías</h2>
        <CreateCategoriaModal userId={userId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Select onValueChange={setFilterField} value={filterField}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Nombre</SelectItem>
            <SelectItem value="tipo">Tipo</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={
            filterField === "nombre"
              ? "Buscar por nombre..."
              : "Buscar por tipo..."
          }
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full"
        />

        <Select onValueChange={setTipoFilter} value={tipoFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
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

      {categoriaSeleccionada && (
        <EditCategoriaModal
          userId={userId}
          categoria={categoriaSeleccionada}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCategoriaSeleccionada(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar esta categoría?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría{" "}
              <strong>{categoriaAEliminar?.nombre}</strong> será eliminada
              permanentemente.
              {categoriaAEliminar?.tipoCategoria === "Ingreso"
                ? " Todos los ingresos asociados perderán esta categoría."
                : " Todos los egresos asociados perderán esta categoría."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCategoriaAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (categoriaAEliminar) {
                  deleteMutation.mutate({
                    id: categoriaAEliminar.id,
                    tipoCategoria: categoriaAEliminar.tipoCategoria,
                  });
                  setIsDeleteModalOpen(false);
                  setCategoriaAEliminar(null);
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
