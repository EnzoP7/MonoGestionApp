import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  PackageCheck,
  DollarSign,
  User,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function VerCompraPage({ params }: PageProps) {
  const compra = await prisma.compra.findUnique({
    where: { id: params.id },
    include: {
      proveedor: true,
      productos: {
        include: {
          producto: true,
        },
      },
      egreso: true,
      user: true,
    },
  });

  if (!compra) return notFound();

  const fechaFormateada = format(new Date(compra.fecha), "dd/MM/yyyy");

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      <div className="mb-2">
        <Link
          href="/dashboard/compras"
          className="text-sm flex items-center gap-2 text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Volver al listado
        </Link>
      </div>

      {/* Información general de la compra */}
      <Card className="shadow-xl border border-muted p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <PackageCheck size={24} className="text-primary" />
            Compra #{compra.id.slice(0, 6)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <span>
              <strong>Proveedor:</strong>{" "}
              {compra.proveedor?.nombre || "Sin proveedor"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <span>
              <strong>Fecha:</strong> {fechaFormateada}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            <span>
              <strong>Monto total:</strong> ${compra.monto.toFixed(2)}
            </span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <span>
              <strong>Descripción:</strong>{" "}
              {compra.descripcion || (
                <em className="text-gray-400">Sin descripción</em>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card className="shadow-lg border border-muted p-6">
        <CardHeader className="pb-1">
          <CardTitle className="text-xl font-semibold">
            Productos comprados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {compra.productos.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border bg-muted/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <p className="font-medium text-sm">{p.producto.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  Cantidad: {p.cantidad} • Precio: ${p.precioUnitario}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit md:ml-auto">
                Subtotal: ${(p.precioUnitario * p.cantidad).toFixed(2)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
