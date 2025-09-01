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
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  Store,
  User,
  Hash
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerMovimientoPage({ params }: Props) {
  const movimiento = await prisma.movimiento.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      ingreso: {
        include: {
          categoriaIngreso: true,
        },
      },
      egreso: {
        include: {
          categoriaEgreso: true,
        },
      },
      compra: {
        include: {
          proveedor: true,
          productos: {
            include: {
              producto: true,
            },
          },
        },
      },
      venta: {
        include: {
          cliente: true,
          VentaProducto: {
            include: {
              producto: true,
            },
          },
          servicios: {
            include: {
              servicio: true,
            },
          },
        },
      },
    },
  });

  if (!movimiento) return notFound();

  const getSourceInfo = () => {
    switch (movimiento.tipo) {
      case "Ingreso":
        return {
          icon: <TrendingUp className="text-green-600" />,
          color: "text-green-600",
          badgeVariant: "default" as const,
          source: "Ingreso directo",
          category: movimiento.ingreso?.categoriaIngreso?.nombre || "Sin categoría",
          detail: movimiento.ingreso?.descripcion,
          relatedLink: movimiento.ingreso ? `/dashboard/ingresos/${movimiento.ingreso.id}` : null,
        };
      case "Egreso":
        return {
          icon: <TrendingDown className="text-red-600" />,
          color: "text-red-600",
          badgeVariant: "destructive" as const,
          source: "Egreso directo",
          category: movimiento.egreso?.categoriaEgreso?.nombre || movimiento.egreso?.categoria || "Sin categoría",
          detail: movimiento.egreso?.descripcion,
          relatedLink: movimiento.egreso ? `/dashboard/egresos/${movimiento.egreso.id}` : null,
        };
      case "Venta":
        return {
          icon: <Store className="text-blue-600" />,
          color: "text-blue-600",
          badgeVariant: "default" as const,
          source: "Venta",
          category: movimiento.venta?.cliente?.nombre || "Cliente no especificado",
          detail: `Tipo: ${movimiento.venta?.tipo || "No especificado"}`,
          relatedLink: null, // Las ventas no tienen pantalla de detalle aún
        };
      case "Compra":
        return {
          icon: <ShoppingCart className="text-orange-600" />,
          color: "text-orange-600",
          badgeVariant: "secondary" as const,
          source: "Compra",
          category: movimiento.compra?.proveedor?.nombre || "Proveedor no especificado",
          detail: movimiento.compra?.descripcion,
          relatedLink: movimiento.compra ? `/dashboard/compras/${movimiento.compra.id}` : null,
        };
      default:
        return {
          icon: <FileText className="text-gray-600" />,
          color: "text-gray-600",
          badgeVariant: "outline" as const,
          source: "Desconocido",
          category: "N/A",
          detail: undefined,
          relatedLink: null,
        };
    }
  };

  const sourceInfo = getSourceInfo();

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del movimiento */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              {sourceInfo.icon}
              Movimiento #{movimiento.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={sourceInfo.badgeVariant}>
                {movimiento.tipo}
              </Badge>
            </div>
          </div>
          {movimiento.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {movimiento.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <DollarSign className={`w-5 h-5 ${sourceInfo.color}`} />
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className={`text-2xl font-bold ${sourceInfo.color}`}>
                {movimiento.tipo === "Egreso" || movimiento.tipo === "Compra" ? "-" : "+"}
                ${movimiento.monto.toLocaleString("es-ES", {
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
                {new Date(movimiento.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Movimiento</p>
              <p className="text-lg font-semibold">{sourceInfo.source}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Usuario</p>
              <p className="text-lg font-semibold">{movimiento.user.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la fuente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {sourceInfo.icon}
            Información de la Fuente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Origen:</h4>
              <p className="text-sm mt-1 font-medium">{sourceInfo.source}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Categoría/Cliente/Proveedor:</h4>
              <p className="text-sm mt-1">{sourceInfo.category}</p>
            </div>

            {sourceInfo.detail && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">Descripción:</h4>
                <p className="text-sm mt-1">{sourceInfo.detail}</p>
              </div>
            )}
          </div>

          {sourceInfo.relatedLink && (
            <div className="pt-2">
              <Link href={sourceInfo.relatedLink}>
                <Button variant="outline" size="sm">
                  Ver registro original →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles específicos por tipo */}
      {movimiento.tipo === "Compra" && movimiento.compra && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Detalles de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Proveedor:</h4>
                <p className="text-sm mt-1 font-medium">
                  {movimiento.compra.proveedor?.nombre || "Sin proveedor"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Productos comprados:</h4>
                <div className="mt-2 space-y-2">
                  {movimiento.compra.productos.map((cp) => (
                    <div key={cp.id} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                      <span className="text-sm">
                        {cp.cantidad}x {cp.producto.nombre}
                      </span>
                      <span className="text-sm font-medium">
                        ${(cp.precioUnitario * cp.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {movimiento.tipo === "Venta" && movimiento.venta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-4 h-4" />
              Detalles de la Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Cliente:</h4>
                <p className="text-sm mt-1 font-medium">
                  {movimiento.venta.cliente?.nombre || "Cliente no especificado"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tipo de venta:</h4>
                <p className="text-sm mt-1">{movimiento.venta.tipo}</p>
              </div>

              {movimiento.venta.VentaProducto.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Productos vendidos:</h4>
                  <div className="mt-2 space-y-2">
                    {movimiento.venta.VentaProducto.map((vp) => (
                      <div key={vp.id} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                        <span className="text-sm">
                          {vp.cantidad}x {vp.producto.nombre}
                        </span>
                        <span className="text-sm font-medium">
                          ${(vp.precio * vp.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {movimiento.venta.servicios.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Servicios vendidos:</h4>
                  <div className="mt-2 space-y-2">
                    {movimiento.venta.servicios.map((vs) => (
                      <div key={vs.id} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                        <span className="text-sm">
                          {vs.cantidad}x {vs.servicio.nombre}
                        </span>
                        <span className="text-sm font-medium">
                          ${(vs.precio * vs.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información técnica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Información Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">ID del movimiento:</h4>
            <p className="text-xs mt-1 font-mono text-muted-foreground">{movimiento.id}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Registrado el:</h4>
            <p className="text-sm mt-1">
              {new Date(movimiento.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Usuario propietario:</h4>
            <p className="text-sm mt-1 font-medium">{movimiento.user.name}</p>
          </div>
        </CardContent>
      </Card>

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/movimientos" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al historial de movimientos
          </Link>
        </Button>
      </div>
    </div>
  );
}