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
import { ArrowLeft, Calendar, Mail, MapPin, Phone, DollarSign, ShoppingCart, Package, TrendingUp, Edit } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerProveedorPage({ params }: Props) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id: params.id },
    include: {
      compras: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          productos: {
            // Cambiado de CompraProducto a productos
            include: {
              producto: true,
            },
          },
        },
      },
    },
  });

  if (!proveedor) return notFound();

  // Calcular estadísticas del proveedor
  const totalCompras = proveedor.compras.reduce((sum, compra) => sum + compra.monto, 0);
  const totalProductosComprados = proveedor.compras.reduce(
    (sum, compra) => sum + compra.productos.reduce((innerSum, cp) => innerSum + cp.cantidad, 0),
    0
  );
  const cantidadCompras = proveedor.compras.length;
  const promedioCompra = cantidadCompras > 0 ? totalCompras / cantidadCompras : 0;

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del proveedor */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold">
              {proveedor.nombre}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default">Proveedor</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/proveedores?edit=${proveedor.id}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
          {proveedor.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {proveedor.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {proveedor.telefono && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="text-lg font-semibold">{proveedor.telefono}</p>
              </div>
            </div>
          )}

          {proveedor.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{proveedor.email}</p>
              </div>
            </div>
          )}

          {proveedor.direccion && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="text-lg font-semibold">{proveedor.direccion}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Creado el</p>
              <p className="text-lg font-semibold">
                {new Date(proveedor.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del Proveedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Comprado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                ${totalCompras.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cantidad de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{cantidadCompras}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos Comprados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{totalProductosComprados}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio por Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                ${promedioCompra.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas compras a este proveedor */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Últimas compras registradas
        </h2>
        <Card className="p-4 space-y-4">
          {proveedor.compras.length > 0 ? (
            proveedor.compras.map((compra) => (
              <div
                key={compra.id}
                className="border p-4 rounded-md bg-muted/10 space-y-2"
              >
                <div className="text-sm text-muted-foreground">
                  Compra del{" "}
                  {new Date(compra.fecha).toLocaleDateString("es-ES")} por{" "}
                  <span className="font-medium">
                    ${compra.monto.toFixed(2)}
                  </span>
                </div>

                <ul className="text-sm list-disc pl-5">
                  {compra.productos.map(
                    (
                      cp // Cambiado de CompraProducto a productos
                    ) => (
                      <li key={cp.id}>
                        {cp.cantidad} x{" "}
                        <span className="font-semibold">
                          {cp.producto.nombre}
                        </span>{" "}
                        a ${cp.precioUnitario.toFixed(2)} c/u
                      </li>
                    )
                  )}
                </ul>
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
          <Link
            href="/dashboard/proveedores"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Link>
        </Button>
      </div>
    </div>
  );
}
