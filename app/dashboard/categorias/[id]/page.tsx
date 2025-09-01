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
import { ArrowLeft, Calendar, FileText, Tag, Edit, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerCategoriaPage({ params }: Props) {
  // Intentar encontrar la categoría en ambas tablas
  const [categoriaIngreso, categoriaEgreso] = await Promise.all([
    prisma.categoriaIngreso.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        Ingreso: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.categoriaEgreso.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        Egreso: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
  ]);

  const categoria = categoriaIngreso || categoriaEgreso;
  const tipoCategoria = categoriaIngreso ? "Ingreso" : "Egreso";
  
  if (!categoria) return notFound();

  // Calcular estadísticas
  const registros = categoriaIngreso ? categoriaIngreso.Ingreso : categoriaEgreso!.Egreso;
  const totalMonto = registros.reduce((sum, registro) => sum + registro.monto, 0);
  const cantidadRegistros = registros.length;
  const promedioMonto = cantidadRegistros > 0 ? totalMonto / cantidadRegistros : 0;

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle de la categoría */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Tag className={tipoCategoria === "Ingreso" ? "text-green-600" : "text-red-600"} />
              {categoria.nombre}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={tipoCategoria === "Ingreso" ? "default" : "destructive"}>
                Categoría de {tipoCategoria}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/categorias?edit=${categoria.id}&tipo=${tipoCategoria}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold">{categoria.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="text-lg font-semibold">{categoria.tipo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BarChart3 className={`w-5 h-5 ${tipoCategoria === "Ingreso" ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="text-lg font-semibold">
                <Badge variant={tipoCategoria === "Ingreso" ? "default" : "destructive"}>
                  {tipoCategoria}
                </Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Creada el</p>
              <p className="text-lg font-semibold">
                {new Date(categoria.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de la categoría */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {tipoCategoria === "Ingreso" ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${tipoCategoria === "Ingreso" ? "text-green-600" : "text-red-600"}`}>
                ${totalMonto.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cantidad de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{cantidadRegistros}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio por Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                ${promedioMonto.toLocaleString("es-ES", {
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
        {/* Detalles de la categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Información de la Categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Nombre:</h4>
              <p className="text-sm mt-1 font-medium">{categoria.nombre}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Tipo:</h4>
              <p className="text-sm mt-1">{categoria.tipo}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Clasificación:</h4>
              <Badge variant={tipoCategoria === "Ingreso" ? "default" : "destructive"}>
                Categoría de {tipoCategoria}s
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Usuario propietario:</h4>
              <p className="text-sm mt-1 font-medium">{categoria.user.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">ID del registro:</h4>
              <p className="text-xs mt-1 font-mono text-muted-foreground">{categoria.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de uso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Registros asociados:</h4>
              <p className="text-sm mt-1">
                {cantidadRegistros > 0 
                  ? `${cantidadRegistros} ${tipoCategoria.toLowerCase()}(s) registrado(s)`
                  : `No hay ${tipoCategoria.toLowerCase()}s asociados`
                }
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Actividad:</h4>
              <p className="text-sm mt-1">
                {cantidadRegistros > 0 
                  ? `Categoría activa con uso regular`
                  : "Categoría sin actividad"
                }
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Última actividad:</h4>
              <p className="text-sm mt-1">
                {registros.length > 0 
                  ? new Date(registros[0].createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Sin actividad registrada"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos registros */}
      {registros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {tipoCategoria === "Ingreso" ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              Últimos {tipoCategoria}s Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registros.slice(0, 5).map((registro) => (
                <div key={registro.id} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        ${registro.monto.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(registro.fecha).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {registro.descripcion || "Sin descripción"}
                      </p>
                      <Link 
                        href={`/dashboard/${tipoCategoria.toLowerCase()}s/${registro.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/categorias" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado de categorías
          </Link>
        </Button>
      </div>
    </div>
  );
}