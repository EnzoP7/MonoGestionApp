"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { z } from "zod";

// --- SCHEMA ---
export const movimientoSchema = z.object({
  id: z.string(),
  tipo: z.enum(["Ingreso", "Egreso", "Venta", "Compra"]),
  fecha: z.string(),
  monto: z.number(),
  descripcion: z.string().optional(),
});

type Movimiento = z.infer<typeof movimientoSchema>;

// --- COLUMNAS ---
const columnasMovimiento: ColumnDef<Movimiento>[] = [
  {
    accessorKey: "tipo",
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="capitalize px-2">
          {row.original.tipo}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "fecha",
    header: () => <div className="text-center">Fecha</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {new Date(row.original.fecha).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "monto",
    header: () => <div className="text-center">Monto</div>,
    cell: ({ row }) => (
      <div
        className={`text-center font-medium ${
          row.original.tipo === "Egreso" ? "text-red-600" : "text-green-600"
        }`}
      >
        ${row.original.monto.toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "descripcion",
    header: () => (
      <div className="text-center hidden md:block">Descripción</div>
    ),
    cell: ({ row }) => (
      <div className="text-center hidden md:block">
        {row.original.descripcion ?? "-"}
      </div>
    ),
  },
  {
    id: "acciones",
    header: () => <div className="text-center">Acción</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Button variant="outline" size="sm">
          Ver
        </Button>
      </div>
    ),
  },
];

// --- FUNC. SIMULADA (reemplazable por fetch real)
function generarMovimientosMock(userId: string): Movimiento[] {
  const tipos: Movimiento["tipo"][] = ["Ingreso", "Egreso", "Venta", "Compra"];
  const descripciones = [
    "Servicio freelance",
    "Compra de insumos",
    "Venta de producto A",
    "Pago a proveedor",
  ];

  return Array.from({ length: 6 }).map((_, i) => {
    const tipo = tipos[i % tipos.length];
    return {
      id: `${userId}-${i + 1}`,
      tipo,
      fecha: new Date(Date.now() - i * 86400000).toISOString(),
      monto: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
      descripcion: descripciones[i % descripciones.length],
    };
  });
}

// --- HOOK USABLE CON REACT QUERY ---
function useMovimientos(userId: string) {
  return useQuery({
    queryKey: ["movimientos", userId],
    queryFn: async () => {
      // 🔁 Reemplazá esto con fetch a tu API real
      const data = generarMovimientosMock(userId);
      return data;
    },
  });
}

// --- COMPONENTE ---
export function DataTable({ userId }: { userId: string }) {
  const { data = [], isLoading } = useMovimientos(userId);

  const table = useReactTable({
    data,
    columns: columnasMovimiento,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-2xl font-semibold text-left">Últimos Movimientos</h2>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-center ${
                      header.column.id === "descripcion"
                        ? "hidden md:table-cell"
                        : ""
                    }`}
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnasMovimiento.length + 1}
                  className="text-center py-6"
                >
                  Cargando movimientos...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`text-center ${
                        cell.column.id === "descripcion"
                          ? "hidden md:table-cell"
                          : ""
                      }`}
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
                  colSpan={columnasMovimiento.length + 1}
                  className="text-center py-6"
                >
                  No hay movimientos recientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
