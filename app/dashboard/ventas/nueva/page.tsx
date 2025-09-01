"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Minus, Package, Briefcase, UserPlus, X, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ventaSchema, type VentaFormData } from "@/lib/validators/venta";
import { useCrearVenta } from "@/lib/react-query/mutations/ventas/useCrearVenta";
import { useClientes } from "@/lib/react-query/queries/clientes/useClientes";
import { useProductosForVenta } from "@/lib/react-query/queries/ventas/useProductosForVenta";
import { useServiciosForVenta } from "@/lib/react-query/queries/ventas/useServiciosForVenta";
import type { VentaFormItem, ClienteOption, ProductoOption, ServicioOption } from "@/types/venta";

// Quick creation components
import { QuickCreateClienteDialog } from "../components/QuickCreateClienteDialog";
import { QuickCreateProductoDialog } from "../components/QuickCreateProductoDialog";
import { QuickCreateServicioDialog } from "../components/QuickCreateServicioDialog";

export default function NuevaVentaPage() {
  const router = useRouter();
  const [items, setItems] = useState<VentaFormItem[]>([]);
  const [total, setTotal] = useState(0);

  const crearVentaMutation = useCrearVenta();
  const { data: clientes = [] } = useClientes();
  const { data: productos = [] } = useProductosForVenta();
  const { data: servicios = [] } = useServiciosForVenta();

  // Type adapters
  const adaptProducto = (producto: any): ProductoOption => ({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    cantidad: producto.cantidad,
    descripcion: producto.descripcion || undefined,
  });

  const adaptServicio = (servicio: any): ServicioOption => ({
    id: servicio.id,
    nombre: servicio.nombre,
    precioBase: servicio.precioBase ?? null,
    descripcion: servicio.descripcion || undefined,
  });

  const form = useForm({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      clienteId: "",
      fecha: new Date().toISOString().split('T')[0],
      tipo: "producto" as const,
      monto: 0,
      productos: [],
      servicios: [],
    },
  });

  // Recalcular total cuando cambien los items
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
    form.setValue("monto", newTotal);

    // Determinar tipo automáticamente
    const hasProductos = items.some(item => item.type === "producto");
    const hasServicios = items.some(item => item.type === "servicio");
    
    let tipo: "producto" | "servicio" | "mixta";
    if (hasProductos && hasServicios) {
      tipo = "mixta";
    } else if (hasProductos) {
      tipo = "producto";
    } else if (hasServicios) {
      tipo = "servicio";
    } else {
      tipo = "producto";
    }
    
    form.setValue("tipo", tipo);

    // Actualizar arrays de productos y servicios
    const productosData = items
      .filter(item => item.type === "producto")
      .map(item => ({
        productoId: item.id,
        cantidad: item.quantity,
        precio: item.price,
      }));

    const serviciosData = items
      .filter(item => item.type === "servicio")
      .map(item => ({
        servicioId: item.id,
        cantidad: item.quantity,
        precio: item.price,
      }));

    form.setValue("productos", productosData);
    form.setValue("servicios", serviciosData);
  }, [items, form]);

  const addProducto = (producto: ProductoOption) => {
    const existingIndex = items.findIndex(item => item.id === producto.id && item.type === "producto");
    
    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const newItems = [...items];
      const currentQuantity = newItems[existingIndex].quantity;
      const maxStock = producto.cantidad;
      
      if (currentQuantity < maxStock) {
        newItems[existingIndex].quantity += 1;
        newItems[existingIndex].subtotal = newItems[existingIndex].price * newItems[existingIndex].quantity;
        setItems(newItems);
      }
    } else {
      // Agregar nuevo item
      if (producto.cantidad > 0) {
        const newItem: VentaFormItem = {
          id: producto.id,
          type: "producto",
          name: producto.nombre,
          price: producto.precio,
          quantity: 1,
          stock: producto.cantidad,
          subtotal: producto.precio,
        };
        setItems([...items, newItem]);
      }
    }
  };

  const addServicio = (servicio: ServicioOption, precio: number) => {
    const existingIndex = items.findIndex(item => item.id === servicio.id && item.type === "servicio");
    
    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].subtotal = newItems[existingIndex].price * newItems[existingIndex].quantity;
      setItems(newItems);
    } else {
      // Agregar nuevo item
      const newItem: VentaFormItem = {
        id: servicio.id,
        type: "servicio",
        name: servicio.nombre,
        price: precio,
        quantity: 1,
        subtotal: precio,
      };
      setItems([...items, newItem]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const newItems = [...items];
    const item = newItems[index];
    
    // Verificar stock para productos
    if (item.type === "producto" && item.stock && quantity > item.stock) {
      return; // No permitir exceder el stock
    }
    
    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    
    const newItems = [...items];
    const item = newItems[index];
    item.price = price;
    item.subtotal = price * item.quantity;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const onSubmit = async (data: any) => {
    try {
      await crearVentaMutation.mutateAsync({
        clienteId: data.clienteId && data.clienteId !== "" ? data.clienteId : undefined,
        fecha: data.fecha,
        tipo: data.tipo,
        monto: data.monto,
        productos: data.productos,
        servicios: data.servicios,
      });
      
      router.push("/dashboard/ventas");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Venta</h1>
            <p className="text-muted-foreground">
              Crea una nueva venta agregando productos y servicios
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cliente */}
                  <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente (opcional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Cliente general</SelectItem>
                                {clientes.map((cliente) => (
                                  <SelectItem key={cliente.id} value={cliente.id}>
                                    {cliente.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <QuickCreateClienteDialog />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha */}
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selección de productos y servicios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Productos y Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Productos */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Productos Disponibles
                        </div>
                        <QuickCreateProductoDialog />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {productos.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay productos disponibles</p>
                          </div>
                        ) : (
                          productos
                            .filter(p => p.activo && p.cantidad > 0)
                            .map((producto) => (
                              <div
                                key={producto.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => addProducto(adaptProducto(producto))}
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{producto.nombre}</h4>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Stock: {producto.cantidad}</span>
                                    <span className="font-medium text-green-600">${producto.precio}</span>
                                  </div>
                                  {producto.descripcion && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {producto.descripcion}
                                    </p>
                                  )}
                                </div>
                                <Button type="button" variant="outline" size="sm">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Servicios */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Servicios Disponibles
                        </div>
                        <QuickCreateServicioDialog />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {servicios.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay servicios disponibles</p>
                          </div>
                        ) : (
                          servicios.map((servicio) => (
                            <div
                              key={servicio.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{servicio.nombre}</h4>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium text-green-600">
                                    Precio base: ${servicio.precioBase || 0}
                                  </span>
                                </div>
                                {servicio.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {servicio.descripcion}
                                  </p>
                                )}
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const precio = servicio.precioBase || 0;
                                  const precioPersonalizado = window.prompt(
                                    `Precio para ${servicio.nombre}:`,
                                    precio.toString()
                                  );
                                  if (precioPersonalizado !== null) {
                                    const precioNumerico = parseFloat(precioPersonalizado);
                                    if (!isNaN(precioNumerico) && precioNumerico >= 0) {
                                      addServicio(adaptServicio(servicio), precioNumerico);
                                    }
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Items seleccionados */}
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Items de la Venta
                    </div>
                    <Badge variant="secondary">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                      <Badge variant={item.type === "producto" ? "default" : "secondary"}>
                        {item.type === "producto" ? <Package className="h-3 w-3 mr-1" /> : <Briefcase className="h-3 w-3 mr-1" />}
                        {item.type}
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        {item.type === "producto" && (
                          <p className="text-sm text-muted-foreground">
                            Stock disponible: {item.stock}
                          </p>
                        )}
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="1"
                          max={item.type === "producto" ? item.stock : undefined}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          disabled={item.type === "producto" && item.stock ? item.quantity >= item.stock : false}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Control de precio */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">$</span>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="text-lg font-semibold w-28 text-right">
                        ${item.subtotal.toLocaleString()}
                      </div>

                      {/* Botón eliminar */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Separator />
                  
                  <div className="flex justify-between items-center py-4">
                    <div className="text-lg font-medium">Total de la Venta:</div>
                    <div className="text-3xl font-bold text-green-600">
                      ${total.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={crearVentaMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={crearVentaMutation.isPending || items.length === 0}
                size="lg"
              >
                {crearVentaMutation.isPending ? "Creando..." : "Crear Venta"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}