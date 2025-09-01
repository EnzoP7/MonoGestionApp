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
import { Pencil, Trash2, Calendar, DollarSign, ArrowUpDown, Briefcase } from "lucide-react";

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
import { useEliminarServicio } from "@/lib/react-query/mutations/servicios/useEliminarServicio";
import { useServicios } from "@/lib/react-query/queries/servicios/useServicios";
import { CreateServicioModal } from "./CreateServicioModal";
import { EditServicioModal } from "./EditServicioModal";
import { Servicio } from "@/types/servicio";

interface CustomColumnMeta {
  className?: string;
}

export function ServiciosTable({ userId }: { userId: string }) {
  const { data: servicios = [], isLoading, error } = useServicios(userId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState("");
  const [precioFilter, setPrecioFilter] = useState("todos");

  const [servicioAEliminar, setServicioAEliminar] = useState<Servicio | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarServicio({ userId });

  const filteredData = useMemo(() => {
    return servicios.filter((servicio: Servicio) => {
      // Filtro por precio
      const matchesPrecio = (() => {
        if (precioFilter === "todos") return true;
        if (precioFilter === "con-precio") return servicio.precioBase !== null && servicio.precioBase !== undefined;
        if (precioFilter === "sin-precio") return servicio.precioBase === null || servicio.precioBase === undefined;
        return true;
      })();

      // Filtro por texto (busca en nombre y descripción)
      const text = filterText.trim().toLowerCase();
      const matchesText = !text || 
        servicio.nombre.toLowerCase().includes(text) ||
        servicio.descripcion?.toLowerCase().includes(text) ||
        (servicio.precioBase && servicio.precioBase.toString().includes(text));

      return matchesPrecio && matchesText;
    });
  }, [servicios, precioFilter, filterText]);

  const resumen = useMemo(() => {
    const conPrecio = filteredData.filter((s: Servicio) => s.precioBase !== null && s.precioBase !== undefined).length;
    const sinPrecio = filteredData.filter((s: Servicio) => s.precioBase === null || s.precioBase === undefined).length;
    const precioPromedio = filteredData
      .filter((s: Servicio) => s.precioBase !== null && s.precioBase !== undefined)
      .reduce((sum: number, s: Servicio) => sum + (s.precioBase || 0), 0) / Math.max(conPrecio, 1);
    
    return {
      total: filteredData.length,
      conPrecio,
      sinPrecio,
      precioPromedio,
    };
  }, [filteredData]);

  const columns: ColumnDef<Servicio>[] = [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{row.original.nombre}</span>
        </div>
      ),
      meta: { className: "text-left" } as CustomColumnMeta,
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.descripcion || ""}>
          {row.original.descripcion || (
            <em className="text-muted-foreground">Sin descripción</em>
          )}
        </div>
      ),
      meta: { className: "text-left hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "precioBase",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Precio Base
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          {row.original.precioBase !== null && row.original.precioBase !== undefined ? (
            <span className="font-medium text-green-600">
              ${row.original.precioBase.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : (
            <Badge variant="outline">Variable</Badge>
          )}
        </div>
      ),
      meta: { className: "text-center" } as CustomColumnMeta,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Fecha Creación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        className: "text-center hidden md:table-cell",
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
              setServicioSeleccionado(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setServicioAEliminar(row.original);
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

  if (isLoading) return <div className="p-4">Cargando servicios...</div>;
  if (error) return <div className="p-4 text-red-500">Error al cargar servicios</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Servicios</h2>
          <p className="text-sm text-muted-foreground">
            Total: {resumen.total} servicio{resumen.total !== 1 ? 's' : ''} • 
            Con precio: {resumen.conPrecio} • 
            Sin precio fijo: {resumen.sinPrecio}
            {resumen.conPrecio > 0 && (
              <> • Precio promedio: ${resumen.precioPromedio.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</>
            )}
          </p>
        </div>
        <CreateServicioModal userId={userId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Buscar por nombre, descripción o precio..."
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full"
        />

        <Select onValueChange={setPrecioFilter} value={precioFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por precio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los servicios</SelectItem>
            <SelectItem value="con-precio">Con precio fijo</SelectItem>
            <SelectItem value="sin-precio">Precio variable</SelectItem>
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
                  onClick={() => window.location.href = `/dashboard/servicios/${row.original.id}`}
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
                  No se encontraron servicios
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

      {servicioSeleccionado && (
        <EditServicioModal
          userId={userId}
          servicio={servicioSeleccionado}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setServicioSeleccionado(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar este servicio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio{" "}
              <strong>{servicioAEliminar?.nombre}</strong> será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setServicioAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (servicioAEliminar) {
                  deleteMutation.mutate(servicioAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setServicioAEliminar(null);
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