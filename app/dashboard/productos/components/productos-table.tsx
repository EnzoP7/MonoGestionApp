// app/dashboard/productos/components/productos-table.tsx
"use client";

import { Producto } from "@/types/producto";
import Link from "next/link";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
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
import { CreateProductoModal } from "./CreateProductoModal";
import { useProductos } from "@/lib/queries/useProductos";

export function ProductosTable({ userId }: { userId: string }) {
  const { data: productos = [], isLoading, error } = useProductos(userId);

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
      header: "",
      cell: ({ row }) => (
        <Link href={`/dashboard/productos/${row.original.id}`}>
          <Button size="sm" variant="outline">
            Ver
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: productos,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
    </div>
  );
}
