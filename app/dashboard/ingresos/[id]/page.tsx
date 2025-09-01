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
import { ArrowLeft, Calendar, DollarSign, FileText, Tag, Edit, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function VerIngresoPage({ params }: Props) {
  const ingreso = await prisma.ingreso.findUnique({
    where: { id: params.id },
    include: {
      categoriaIngreso: true,
      user: true,
      Movimiento: true,
    },
  });

  if (!ingreso) return notFound();

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del ingreso */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="text-green-600" />
              Ingreso #{ingreso.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Ingreso
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/ingresos?edit=${ingreso.id}`} className="flex items-center gap-1">
                  <Edit className="w-3 h-3" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
          {ingreso.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {ingreso.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="text-2xl font-bold text-green-600">
                ${ingreso.monto.toLocaleString("es-ES", {
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
                {new Date(ingreso.fecha).toLocaleDateString("es-ES", {
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
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="text-lg font-semibold">
                {ingreso.categoriaIngreso ? (
                  <Badge variant="outline">{ingreso.categoriaIngreso.nombre}</Badge>
                ) : (
                  <Badge variant="secondary">Sin categoría</Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Registrado el</p>
              <p className="text-lg font-semibold">
                {new Date(ingreso.createdAt).toLocaleDateString("es-ES", {
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
                {ingreso.descripcion || (
                  <em className="text-muted-foreground">Sin descripción adicional</em>
                )}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Usuario:</h4>
              <p className="text-sm mt-1 font-medium">{ingreso.user.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">ID del registro:</h4>
              <p className="text-xs mt-1 font-mono text-muted-foreground">{ingreso.id}</p>
            </div>
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
            {ingreso.categoriaIngreso ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Categoría:</h4>
                <div className="mt-1">
                  <Badge variant="default">{ingreso.categoriaIngreso.nombre}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tipo: {ingreso.categoriaIngreso.tipo}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Categoría:</h4>
                <p className="text-sm mt-1 italic text-muted-foreground">
                  Este ingreso no tiene una categoría asignada
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Movimientos relacionados:</h4>
              <p className="text-sm mt-1">
                {ingreso.Movimiento.length > 0 
                  ? `${ingreso.Movimiento.length} movimiento(s) registrado(s)`
                  : "Sin movimientos asociados"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón volver */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/ingresos" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado de ingresos
          </Link>
        </Button>
      </div>
    </div>
  );
}