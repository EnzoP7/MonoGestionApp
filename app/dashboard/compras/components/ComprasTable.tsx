"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { Compra, Proveedor } from "@prisma/client";
import { useCompras } from "@/lib/react-query/queries/compras/useCompras";
import { CreateCompraModal } from "./CreateCompraModal";
import { useEliminarCompra } from "@/lib/react-query/mutations/compras/useEliminarCompra";
import { CompraConProveedor } from "@/types/compra";
import { EditCompraModal } from "./EditCompraModal";

export function ComprasTable({ userId }: { userId: string }) {
  const { data: compras = [], isLoading, error } = useCompras(userId);

  const [filterField, setFilterField] = useState("proveedor");
  const [filterText, setFilterText] = useState("");
  const [compraAEliminar, setCompraAEliminar] =
    useState<CompraConProveedor | null>(null);
  const [compraAEditar, setCompraAEditar] = useState<CompraConProveedor | null>(
    null
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteMutation = useEliminarCompra({ userId });

  const filteredData = useMemo(() => {
    return compras.filter((c) => {
      const text = filterText.trim().toLowerCase();
      if (!text) return true;
      if (filterField === "proveedor") {
        return c.proveedor?.nombre?.toLowerCase().includes(text);
      } else if (filterField === "monto") {
        const val = parseFloat(text);
        return !isNaN(val) && c.monto >= val;
      }
      return true;
    });
  }, [compras, filterField, filterText]);

  const columns: ColumnDef<CompraConProveedor>[] = [
    {
      accessorKey: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedor?.nombre || "Sin proveedor",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString(),
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => <div>${row.original.monto.toFixed(2)}</div>,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Link href={`/compras/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4 text-primary" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCompraAEditar(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCompraAEliminar(row.original);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable<CompraConProveedor>({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <div className="p-4">Cargando compras...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error al cargar compras</div>;

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Compras</h2>
        <CreateCompraModal userId={userId} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Select onValueChange={setFilterField} value={filterField}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proveedor">Proveedor</SelectItem>
            <SelectItem value="monto">Monto mínimo</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={
            filterField === "proveedor" ? "Buscar proveedor..." : "Monto mínimo"
          }
          type={filterField === "monto" ? "number" : "text"}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-48"
        />
      </div>

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

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Seguro que querés eliminar esta
              compra?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCompraAEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (compraAEliminar) {
                  deleteMutation.mutate(compraAEliminar.id);
                  setIsDeleteModalOpen(false);
                  setCompraAEliminar(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {compraAEditar && (
        <EditCompraModal
          userId={userId}
          compra={compraAEditar}
          open={isEditModalOpen}
          onOpenChange={() => setIsEditModalOpen(false)} // ✅ Esto sí es válido
        />
      )}
    </div>
  );
}
