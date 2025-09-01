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
import { ArrowLeft, Calendar, DollarSign, FileText, Briefcase, Edit, TrendingUp, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerServicioPage({ params }: Props) {
  const servicio = await prisma.servicio.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      ventas: {
        include: {
          venta: {
            include: {
              cliente: true,
            },
          },
        },
        orderBy: { venta: { createdAt: "desc" } },
      },
    },
  });

  if (!servicio) return notFound();

  // Calcular estadísticas
  const totalVentas = servicio.ventas.reduce((sum, vs) => sum + (vs.precio * vs.cantidad), 0);
  const totalUnidadesVendidas = servicio.ventas.reduce((sum, vs) => sum + vs.cantidad, 0);
  const cantidadVentas = servicio.ventas.length;
  const precioPromedio = cantidadVentas > 0 ? totalVentas / totalUnidadesVendidas : 0;
  const clientesUnicos = new Set(servicio.ventas.map(vs => vs.venta.clienteId).filter(Boolean)).size;

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del servicio */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="text-blue-600" />
              {servicio.nombre}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                Servicio
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/servicios?edit=${servicio.id}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
          {servicio.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {servicio.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold">{servicio.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Precio Base</p>
              <p className="text-lg font-semibold">
                {servicio.precioBase !== null && servicio.precioBase !== undefined ? (
                  <span className="text-green-600">
                    ${servicio.precioBase.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                ) : (
                  <Badge variant="outline">Precio Variable</Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Facturado</p>
              <p className="text-lg font-semibold text-blue-600">
                ${totalVentas.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Creado el</p>
              <p className="text-lg font-semibold">
                {new Date(servicio.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del servicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{totalUnidadesVendidas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cantidad de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{cantidadVentas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{clientesUnicos}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                ${precioPromedio.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles del servicio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Información del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Nombre:</h4>
              <p className="text-sm mt-1 font-medium">{servicio.nombre}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Descripción:</h4>
              <p className="text-sm mt-1">
                {servicio.descripcion || (
                  <em className="text-muted-foreground">Sin descripción</em>
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Precio base:</h4>
              <p className="text-sm mt-1">
                {servicio.precioBase !== null && servicio.precioBase !== undefined ? (
                  <span className="font-medium text-green-600">
                    ${servicio.precioBase.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Precio variable según la venta</span>
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Usuario propietario:</h4>
              <p className="text-sm mt-1 font-medium">{servicio.user.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">ID del registro:</h4>
              <p className="text-xs mt-1 font-mono text-muted-foreground">{servicio.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Ventas registradas:</h4>
              <p className="text-sm mt-1">
                {cantidadVentas > 0 
                  ? `${cantidadVentas} venta(s) registrada(s)`
                  : "No hay ventas registradas"
                }
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Total de unidades:</h4>
              <p className="text-sm mt-1 font-medium">{totalUnidadesVendidas} unidad(es)</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Actividad:</h4>
              <p className="text-sm mt-1">
                {cantidadVentas > 0 
                  ? `Servicio activo con ${clientesUnicos} cliente(s) único(s)`
                  : "Servicio sin actividad de ventas"
                }
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Última venta:</h4>
              <p className="text-sm mt-1">
                {servicio.ventas.length > 0 
                  ? new Date(servicio.ventas[0].venta.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Sin ventas registradas"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas ventas */}
      {servicio.ventas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Últimas Ventas del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servicio.ventas.slice(0, 5).map((ventaServicio) => (
                <div key={ventaServicio.id} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {ventaServicio.cantidad} unidad{ventaServicio.cantidad !== 1 ? 'es' : ''} × ${ventaServicio.precio.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ventaServicio.venta.fecha).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        Total: ${(ventaServicio.precio * ventaServicio.cantidad).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ventaServicio.venta.cliente?.nombre || "Cliente no especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {servicio.ventas.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    ... y {servicio.ventas.length - 5} venta(s) más
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/servicios" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado de servicios
          </Link>
        </Button>
      </div>
    </div>
  );
}