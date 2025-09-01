"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  Briefcase,
  ShoppingCart,
  FileText
} from "lucide-react";
import { useVenta } from "@/lib/react-query/queries/ventas/useVenta";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VentaDetailPageProps {
  params: Promise<{ id: string }>;
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case "producto":
      return <Package className="h-5 w-5 text-blue-600" />;
    case "servicio":
      return <Briefcase className="h-5 w-5 text-purple-600" />;
    default:
      return <div className="h-5 w-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />;
  }
};

const getTipoBadgeVariant = (tipo: string): "default" | "secondary" | "outline" => {
  switch (tipo) {
    case "producto":
      return "default";
    case "servicio":
      return "secondary";
    default:
      return "outline";
  }
};

export default function VentaDetailPage({ params }: VentaDetailPageProps) {
  const { id } = use(params);
  const { data: venta, isLoading, error } = useVenta(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Venta no encontrada</h1>
          <p className="text-muted-foreground">
            La venta que buscas no existe o no tienes permisos para verla.
          </p>
          <Button asChild>
            <Link href="/dashboard/ventas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Ventas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalItems = venta.VentaProducto.length + venta.servicios.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/ventas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {getTipoIcon(venta.tipo)}
              <h1 className="text-3xl font-bold tracking-tight">
                Venta {venta.tipo}
              </h1>
              <Badge variant={getTipoBadgeVariant(venta.tipo)}>
                {venta.tipo.charAt(0).toUpperCase() + venta.tipo.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Realizada el {format(new Date(venta.fecha), "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de la Venta */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Detalles básicos de la venta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">
                  {venta.cliente?.nombre || "Cliente general"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Fecha de venta</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Monto total</p>
                <p className="text-xl font-bold text-green-600">
                  ${venta.monto.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Items vendidos</p>
                <p className="text-sm text-muted-foreground">
                  {totalItems} item{totalItems !== 1 ? "s" : ""} en total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              Desglose por tipo de item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {venta.VentaProducto.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{venta.VentaProducto.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Producto{venta.VentaProducto.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-medium">
                    ${venta.VentaProducto.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {venta.servicios.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{venta.servicios.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Servicio{venta.servicios.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-medium">
                    ${venta.servicios.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle de productos */}
      {venta.VentaProducto.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Vendidos
            </CardTitle>
            <CardDescription>
              Lista de productos incluidos en esta venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.VentaProducto.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.producto.nombre}</p>
                          {item.producto.descripcion && (
                            <p className="text-sm text-muted-foreground">
                              {item.producto.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>${item.precio.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${(item.precio * item.cantidad).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalle de servicios */}
      {venta.servicios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Servicios Prestados
            </CardTitle>
            <CardDescription>
              Lista de servicios incluidos en esta venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.servicios.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.servicio.nombre}</p>
                          {item.servicio.descripcion && (
                            <p className="text-sm text-muted-foreground">
                              {item.servicio.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>${item.precio.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${(item.precio * item.cantidad).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}