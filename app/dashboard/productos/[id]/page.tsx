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
import { ArrowLeft, Calendar, Package, DollarSign, Truck, TrendingUp, TrendingDown, BarChart3, Edit } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerProductoPage({ params }: Props) {
  const producto = await prisma.producto.findUnique({
    where: { id: params.id },
    include: {
      compras: {
        // Según tu esquema, la relación se llama "compras"
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
        // Según tu esquema, se llama "VentaProducto"
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

  // Calcular estadísticas
  const totalVentas = producto.VentaProducto.reduce((sum, vp) => sum + (vp.precio * vp.cantidad), 0);
  const totalCompras = producto.compras.reduce((sum, cp) => sum + (cp.precioUnitario * cp.cantidad), 0);
  const unidadesVendidas = producto.VentaProducto.reduce((sum, vp) => sum + vp.cantidad, 0);
  const unidadesCompradas = producto.compras.reduce((sum, cp) => sum + cp.cantidad, 0);

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del producto */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold">
              {producto.nombre}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={producto.activo ? "default" : "destructive"}>
                {producto.activo ? "Activo" : "Inactivo"}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/productos?edit=${producto.id}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
          {producto.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {producto.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Precio Unitario</p>
              <p className="text-lg font-semibold">
                ${producto.precio.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Stock Actual</p>
              <p className="text-lg font-semibold">{producto.cantidad}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Ventas</p>
              <p className="text-lg font-semibold text-green-600">
                ${totalVentas.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Compras</p>
              <p className="text-lg font-semibold text-blue-600">
                ${totalCompras.toFixed(2)}
              </p>
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

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{unidadesVendidas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Compradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{unidadesCompradas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rotación de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {unidadesCompradas > 0 ? ((unidadesVendidas / unidadesCompradas) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                ${totalCompras > 0 ? (totalVentas - totalCompras).toFixed(2) : totalVentas.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas ventas del producto */}
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
          {producto.compras.length > 0 ? (
            producto.compras.map((cp) => (
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
          <Link href="/dashboard/productos" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Link>
        </Button>
      </div>
    </div>
  );
}
