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
import { useEliminarIngreso } from "@/lib/react-query/mutations/ingresos/useEliminarIngreso";
import { useIngresos } from "@/lib/react-query/queries/ingresos/useIngresos";
import { CreateIngresoModal } from "./CreateIngresoModal";
import { EditIngresoModal } from "./EditIngresoModal";
import { Ingreso } from "@/types/ingreso";
import { CategoriaIngreso } from "@/types/categoria";

interface CustomColumnMeta {
  className?: string;
}

export function IngresosTable({ userId }: { userId: string }) {
  const { data: ingresos = [], isLoading, error } = useIngresos(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");

  const [ingresoAEliminar, setIngresoAEliminar] = useState<Ingreso | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState<Ingreso | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarIngreso({ userId });

  const categorias = useMemo(() => {
    const uniqueCategorias = new Set<string>();
    return ingresos
      .filter((ingreso: Ingreso) => ingreso.categoriaIngreso)
      .filter((ingreso: Ingreso) => {
        const nombre = ingreso.categoriaIngreso!.nombre;
        if (uniqueCategorias.has(nombre)) return false;
        uniqueCategorias.add(nombre);
        return true;
      })
      .map((ingreso: Ingreso) => ingreso.categoriaIngreso!);
  }, [ingresos]);

  const filteredData = useMemo(() => {
    return ingresos.filter((ingreso: Ingreso) => {
      const matchesCategoria =
        categoriaFilter === "todas" ||
        categoriaFilter === "sin-categoria"
          ? categoriaFilter === "sin-categoria"
            ? !ingreso.categoriaIngreso
            : true
          : ingreso.categoriaIngreso?.id === categoriaFilter;

      const text = filterText.trim().toLowerCase();
      const matchesText =
        !text ||
        ingreso.descripcion?.toLowerCase().includes(text) ||
        ingreso.categoriaIngreso?.nombre.toLowerCase().includes(text) ||
        ingreso.monto.toString().includes(text);

      return matchesCategoria && matchesText;
    });
  }, [ingresos, categoriaFilter, filterText]);

  const totalMonto = useMemo(() => {
    return filteredData.reduce((sum: number, ingreso: Ingreso) => sum + ingreso.monto, 0);
  }, [filteredData]);

  const columns: ColumnDef<Ingreso>[] = [
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
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-green-600">
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
      accessorKey: "categoriaIngreso",
      header: "Categoría",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.categoriaIngreso ? (
            <Badge variant="default">
              {row.original.categoriaIngreso.nombre}
            </Badge>
          ) : (
            <Badge variant="outline">Sin categoría</Badge>
          )}
        </div>
      ),
      meta: { className: "text-center hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.descripcion || ""}>
          {row.original.descripcion || "-"}
        </div>
      ),
      meta: { className: "text-center hidden md:table-cell" } as CustomColumnMeta,
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
              setIngresoSeleccionado(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIngresoAEliminar(row.original);
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

  if (isLoading) return <div className="p-4">Cargando ingresos...</div>;
  if (error) return <div className="p-4 text-red-500">Error al cargar ingresos</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Ingresos</h2>
          <p className="text-sm text-muted-foreground">
            Total: ${totalMonto.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ({filteredData.length} registro{filteredData.length !== 1 ? 's' : ''})
          </p>
        </div>
        <CreateIngresoModal userId={userId} />
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
            {categorias.map((categoria: CategoriaIngreso) => (
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
                <TableRow 
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/dashboard/ingresos/${row.original.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        (cell.column.columnDef.meta as CustomColumnMeta)
                          ?.className || "text-center"
                      }
                      onClick={(e) => {
                        if (cell.column.id === 'acciones') {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No se encontraron ingresos
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

      {ingresoSeleccionado && (
        <EditIngresoModal
          userId={userId}
          ingreso={ingresoSeleccionado}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setIngresoSeleccionado(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar este ingreso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ingreso de{" "}
              <strong>
                ${ingresoAEliminar?.monto.toLocaleString("es-ES", {
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
                setIngresoAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (ingresoAEliminar) {
                  deleteMutation.mutate(ingresoAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setIngresoAEliminar(null);
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