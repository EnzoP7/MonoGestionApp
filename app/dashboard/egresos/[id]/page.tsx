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
import { ArrowLeft, Calendar, DollarSign, FileText, Tag, Edit, TrendingDown, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerEgresoPage({ params }: Props) {
  const egreso = await prisma.egreso.findUnique({
    where: { id: params.id },
    include: {
      categoriaEgreso: true,
      user: true,
      Movimiento: true,
      Compra: {
        include: {
          proveedor: true,
          productos: {
            include: {
              producto: true,
            },
          },
        },
      },
    },
  });

  if (!egreso) return notFound();

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del egreso */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <TrendingDown className="text-red-600" />
              Egreso #{egreso.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                Egreso
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/egresos?edit=${egreso.id}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
          {egreso.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {egreso.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="text-2xl font-bold text-red-600">
                ${egreso.monto.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="text-lg font-semibold">
                {new Date(egreso.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Categoría General</p>
              <p className="text-lg font-semibold">
                <Badge variant="outline">{egreso.categoria}</Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Registrado el</p>
              <p className="text-lg font-semibold">
                {new Date(egreso.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Descripción detallada */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Descripción:</h4>
              <p className="text-sm mt-1">
                {egreso.descripcion || (
                  <em className="text-muted-foreground">Sin descripción adicional</em>
                )}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Usuario:</h4>
              <p className="text-sm mt-1 font-medium">{egreso.user.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">ID del registro:</h4>
              <p className="text-xs mt-1 font-mono text-muted-foreground">{egreso.id}</p>
            </div>

            {egreso.Compra.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Compras asociadas:</h4>
                <p className="text-sm mt-1">{egreso.Compra.length} compra(s) relacionada(s)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Categoría General:</h4>
              <div className="mt-1">
                <Badge variant="outline">{egreso.categoria}</Badge>
              </div>
            </div>

            {egreso.categoriaEgreso ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Categoría Específica:</h4>
                <div className="mt-1">
                  <Badge variant="default">{egreso.categoriaEgreso.nombre}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tipo: {egreso.categoriaEgreso.tipo}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Categoría Específica:</h4>
                <p className="text-sm mt-1 italic text-muted-foreground">
                  Este egreso no tiene una categoría específica asignada
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Movimientos relacionados:</h4>
              <p className="text-sm mt-1">
                {egreso.Movimiento.length > 0 
                  ? `${egreso.Movimiento.length} movimiento(s) registrado(s)`
                  : "Sin movimientos asociados"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compras relacionadas */}
      {egreso.Compra.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Compras Relacionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {egreso.Compra.map((compra) => (
                <div key={compra.id} className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      Compra #{compra.id.slice(0, 6)}
                    </h4>
                    <Badge variant="outline">
                      ${compra.monto.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Proveedor:</p>
                      <p className="font-medium">
                        {compra.proveedor?.nombre || "Sin proveedor"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha:</p>
                      <p className="font-medium">
                        {new Date(compra.fecha).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>

                  {compra.productos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-muted-foreground text-xs mb-2">Productos:</p>
                      <div className="flex flex-wrap gap-1">
                        {compra.productos.map((cp) => (
                          <Badge key={cp.id} variant="secondary" className="text-xs">
                            {cp.cantidad}x {cp.producto.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/egresos" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado de egresos
          </Link>
        </Button>
      </div>
    </div>
  );
}