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
import { Pencil, Trash2, Calendar, DollarSign, ArrowUpDown } from "lucide-react";

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
import { useEliminarEgreso } from "@/lib/react-query/mutations/egresos/useEliminarEgreso";
import { useEgresos } from "@/lib/react-query/queries/egresos/useEgresos";
import { CreateEgresoModal } from "./CreateEgresoModal";
import { EditEgresoModal } from "./EditEgresoModal";
import { Egreso } from "@/types/egreso";
import { CategoriaEgreso } from "@/types/categoria";

interface CustomColumnMeta {
  className?: string;
}

export function EgresosTable({ userId }: { userId: string }) {
  const { data: egresos = [], isLoading, error } = useEgresos(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");

  const [egresoAEliminar, setEgresoAEliminar] = useState<Egreso | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState<Egreso | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarEgreso({ userId });

  const categorias = useMemo(() => {
    const uniqueCategorias = new Set<string>();
    return egresos
      .filter((egreso: Egreso) => egreso.categoriaEgreso)
      .filter((egreso: Egreso) => {
        const nombre = egreso.categoriaEgreso!.nombre;
        if (uniqueCategorias.has(nombre)) return false;
        uniqueCategorias.add(nombre);
        return true;
      })
      .map((egreso: Egreso) => egreso.categoriaEgreso!);
  }, [egresos]);

  const filteredData = useMemo(() => {
    return egresos.filter((egreso: Egreso) => {
      const matchesCategoria =
        categoriaFilter === "todas" ||
        categoriaFilter === "sin-categoria"
          ? categoriaFilter === "sin-categoria"
            ? !egreso.categoriaEgreso
            : true
          : egreso.categoriaEgreso?.id === categoriaFilter;

      const text = filterText.trim().toLowerCase();
      const matchesText =
        !text ||
        egreso.descripcion?.toLowerCase().includes(text) ||
        egreso.categoriaEgreso?.nombre.toLowerCase().includes(text) ||
        egreso.categoria.toLowerCase().includes(text) ||
        egreso.monto.toString().includes(text);

      return matchesCategoria && matchesText;
    });
  }, [egresos, categoriaFilter, filterText]);

  const totalMonto = useMemo(() => {
    return filteredData.reduce((sum: number, egreso: Egreso) => sum + egreso.monto, 0);
  }, [filteredData]);

  const columns: ColumnDef<Egreso>[] = [
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
          <DollarSign className="w-4 h-4 text-red-600" />
          <span className="text-red-600">
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
      header: "Categoría General",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">
            {row.original.categoria}
          </Badge>
        </div>
      ),
      meta: { className: "text-center hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "categoriaEgreso",
      header: "Categoría Específica",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.categoriaEgreso ? (
            <Badge variant="default">
              {row.original.categoriaEgreso.nombre}
            </Badge>
          ) : (
            <Badge variant="outline">Sin categoría</Badge>
          )}
        </div>
      ),
      meta: { className: "text-center hidden md:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.descripcion || ""}>
          {row.original.descripcion || "-"}
        </div>
      ),
      meta: { className: "text-center hidden lg:table-cell" } as CustomColumnMeta,
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
              setEgresoSeleccionado(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEgresoAEliminar(row.original);
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
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (isLoading) return <div className="p-4">Cargando egresos...</div>;
  if (error) return <div className="p-4 text-red-500">Error al cargar egresos</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Egresos</h2>
          <p className="text-sm text-muted-foreground">
            Total: ${totalMonto.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ({filteredData.length} registro{filteredData.length !== 1 ? 's' : ''})
          </p>
        </div>
        <CreateEgresoModal userId={userId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Buscar por descripción, categoría o monto..."
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full"
        />

        <Select onValueChange={setCategoriaFilter} value={categoriaFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            <SelectItem value="sin-categoria">Sin categoría</SelectItem>
            {categorias.map((categoria: CategoriaEgreso) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </SelectItem>
            ))}
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No se encontraron egresos
                </TableCell>
              </TableRow>
            )}
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

      {egresoSeleccionado && (
        <EditEgresoModal
          userId={userId}
          egreso={egresoSeleccionado}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar este egreso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El egreso de{" "}
              <strong>
                ${egresoAEliminar?.monto.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>{" "}
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setEgresoAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (egresoAEliminar) {
                  deleteMutation.mutate(egresoAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setEgresoAEliminar(null);
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