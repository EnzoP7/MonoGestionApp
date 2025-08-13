"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Proveedor } from "@/types/proveedor";
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
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useEliminarProveedor } from "@/lib/react-query/mutations/proveedores/useEliminarProveedor";
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
import { CreateProveedorModal } from "./CreateProveedorModal";
import { EditProveedorModal } from "./EditProveedorModal";
import { useProveedores } from "@/lib/react-query/queries/proveedores/useProveedores";
import { cn } from "@/lib/utils";

// Definir interfaz personalizada para meta
interface CustomColumnMeta {
  className?: string;
}

export function ProveedoresTable({ userId }: { userId: string }) {
  const { data: proveedores = [], isLoading, error } = useProveedores(userId);
  const [globalFilter, setGlobalFilter] = useState("");
  const [proveedorAEliminar, setProveedorAEliminar] =
    useState<Proveedor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<Proveedor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const deleteMutation = useEliminarProveedor({ userId });

  const filteredData = useMemo(() => {
    return proveedores.filter((p) =>
      p.nombre.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [proveedores, globalFilter]);

  const columns: ColumnDef<Proveedor>[] = [
    { accessorKey: "nombre", header: "Nombre" },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => row.original.telefono,
      meta: { className: "" } as CustomColumnMeta,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email,
      meta: { className: "hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => row.original.direccion,
      meta: { className: "hidden sm:table-cell" } as CustomColumnMeta,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Link href={`/dashboard/proveedores/${row.original.id}?view=1`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4 text-primary" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setProveedorSeleccionado(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setProveedorAEliminar(row.original);
              setIsDeleteModalOpen(true);
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

  if (isLoading) return <div className="p-4">Cargando proveedores...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error al cargar proveedores</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Proveedores</h2>
        <CreateProveedorModal userId={userId} />
      </div>

      <Input
        placeholder="Buscar por nombre..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[700px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-center",
                      (header.column.columnDef.meta as CustomColumnMeta)
                        ?.className
                    )}
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
                    className={cn(
                      "text-center",
                      (cell.column.columnDef.meta as CustomColumnMeta)
                        ?.className
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

      {proveedorSeleccionado && (
        <EditProveedorModal
          userId={userId}
          proveedor={proveedorSeleccionado}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setProveedorSeleccionado(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de eliminar este proveedor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proveedor{" "}
              <strong>{proveedorAEliminar?.nombre}</strong> será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProveedorAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (proveedorAEliminar) {
                  deleteMutation.mutate(proveedorAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setProveedorAEliminar(null);
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
