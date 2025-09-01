"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingCart } from "lucide-react";
import { useCliente } from "@/lib/react-query/queries/clientes/useCliente";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClienteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClienteDetailPage({ params }: ClienteDetailPageProps) {
  const { id } = use(params);
  const { data: cliente, isLoading, error } = useCliente(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
          <p className="text-muted-foreground">
            El cliente que buscas no existe o no tienes permisos para verlo.
          </p>
          <Button asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Clientes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
            <p className="text-muted-foreground">
              Cliente desde {new Date(cliente.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription>
              Datos de contacto y ubicación del cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {cliente.email || "No especificado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Teléfono</p>
                <p className="text-sm text-muted-foreground">
                  {cliente.telefono || "No especificado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dirección</p>
                <p className="text-sm text-muted-foreground">
                  {cliente.direccion || "No especificada"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Fecha de Registro</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(cliente.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
            <CardDescription>
              Resumen de la actividad del cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cliente._count.ventas}</p>
                <p className="text-sm text-muted-foreground">
                  {cliente._count.ventas === 1 ? "Venta realizada" : "Ventas realizadas"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
          <CardDescription>
            Últimas ventas realizadas a este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cliente.ventas.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.ventas.map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>
                        {new Date(venta.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{venta.tipo}</TableCell>
                      <TableCell className="font-medium">
                        ${venta.monto.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Completada</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Sin ventas registradas</h3>
              <p className="text-muted-foreground">
                Este cliente aún no ha realizado ninguna compra.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}