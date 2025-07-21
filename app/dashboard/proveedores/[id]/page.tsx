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
import { ArrowLeft, Calendar, Mail, MapPin, Phone } from "lucide-react";

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
          CompraProducto: {
            include: {
              producto: true,
            },
          },
        },
      },
    },
  });

  if (!proveedor) return notFound();

  return (
    <div className="w-full min-h-screen bg-background p-6 space-y-6">
      {/* Detalle del proveedor */}
      <Card className="w-full shadow-xl border border-muted p-6">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-3xl font-bold">
              {proveedor.nombre}
            </CardTitle>
            <Badge variant="default">Proveedor</Badge>
          </div>
          {proveedor.descripcion && (
            <CardDescription className="text-muted-foreground text-base">
              {proveedor.descripcion}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
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
                  {compra.CompraProducto.map((cp) => (
                    <li key={cp.id}>
                      {cp.cantidad} x{" "}
                      <span className="font-semibold">
                        {cp.producto.nombre}
                      </span>{" "}
                      a ${cp.precioUnitario.toFixed(2)} c/u
                    </li>
                  ))}
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
          <a href="/dashboard/proveedores" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </a>
        </Button>
      </div>
    </div>
  );
}
