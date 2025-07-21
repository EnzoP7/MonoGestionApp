import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Calendar, Package, DollarSign, Truck } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function VerProductoPage({ params }: Props) {
  const producto = await prisma.producto.findUnique({
    where: { id: params.id },
    include: {
      CompraProducto: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          compra: {
            include: {
              proveedor: true,
            },
          },
        },
      },
      VentaProducto: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          venta: {
            include: {
              cliente: true,
            },
          },
        },
      },
    },
  });

  if (!producto) return notFound();

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del producto */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold">
              {producto.nombre}
            </CardTitle>
            <Badge variant={producto.activo ? "default" : "destructive"}>
              {producto.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {producto.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {producto.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-lg font-semibold">
                ${producto.precio.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Cantidad</p>
              <p className="text-lg font-semibold">{producto.cantidad}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Creado el</p>
              <p className="text-lg font-semibold">
                {new Date(producto.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Últimas ventas del producto (simuladas) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Últimas ventas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {producto.VentaProducto.length > 0 ? (
            producto.VentaProducto.map((vp) => (
              <Card key={vp.id} className="border-muted shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {vp.venta.cliente?.nombre || "Cliente desconocido"}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Fecha:{" "}
                    {new Date(vp.venta.fecha).toLocaleDateString("es-ES")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Cantidad: <span className="font-medium">{vp.cantidad}</span>
                  </p>
                  <p className="text-sm">
                    Total:{" "}
                    <span className="font-medium">
                      ${(vp.precio * vp.cantidad).toFixed(2)}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay ventas registradas.
            </p>
          )}
        </div>
      </section>

      {/* Historial de compras al proveedor */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Últimas compras al proveedor
        </h2>
        <Card className="p-4 space-y-4">
          {producto.CompraProducto.length > 0 ? (
            producto.CompraProducto.map((cp) => (
              <div
                key={cp.id}
                className="flex justify-between items-center bg-muted/10 p-4 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium">
                    Proveedor: {cp.compra.proveedor?.nombre || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fecha:{" "}
                    {new Date(cp.compra.fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  +{cp.cantidad} unidades a ${cp.precioUnitario.toFixed(2)} c/u
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay compras registradas.
            </p>
          )}
        </Card>
      </section>

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <a href="/dashboard/productos" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </a>
        </Button>
      </div>
    </div>
  );
}
