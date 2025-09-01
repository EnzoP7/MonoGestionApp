import { z } from "zod";

export const ventaProductoItemSchema = z.object({
  productoId: z.string().min(1, "Producto es requerido"),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export const ventaServicioItemSchema = z.object({
  servicioId: z.string().min(1, "Servicio es requerido"),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0").default(1),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export const ventaSchema = z.object({
  clienteId: z.string().optional().nullable(),
  fecha: z.string().or(z.date()).transform((val) => new Date(val)),
  tipo: z.enum(["producto", "servicio", "mixta"], {
    required_error: "Tipo de venta es requerido",
    invalid_type_error: "Tipo de venta debe ser: producto, servicio o mixta"
  }),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  productos: z.array(ventaProductoItemSchema).optional().default([]),
  servicios: z.array(ventaServicioItemSchema).optional().default([]),
})
.refine((data) => {
  // Validar que tenga al menos productos o servicios
  const hasProductos = data.productos && data.productos.length > 0;
  const hasServicios = data.servicios && data.servicios.length > 0;
  
  return hasProductos || hasServicios;
}, {
  message: "Debe incluir al menos un producto o servicio",
  path: ["productos"]
})
.refine((data) => {
  // Validar consistencia del tipo
  const hasProductos = data.productos && data.productos.length > 0;
  const hasServicios = data.servicios && data.servicios.length > 0;
  
  if (data.tipo === "producto" && !hasProductos) {
    return false;
  }
  
  if (data.tipo === "servicio" && !hasServicios) {
    return false;
  }
  
  if (data.tipo === "mixta" && !(hasProductos && hasServicios)) {
    return false;
  }
  
  return true;
}, {
  message: "El tipo de venta no coincide con los items seleccionados",
  path: ["tipo"]
})
.refine((data) => {
  // Validar que el monto coincida con el total calculado
  const totalProductos = (data.productos || []).reduce((sum, item) => 
    sum + (item.precio * item.cantidad), 0
  );
  const totalServicios = (data.servicios || []).reduce((sum, item) => 
    sum + (item.precio * item.cantidad), 0
  );
  const totalCalculado = totalProductos + totalServicios;
  
  // Permitir una pequeña diferencia por redondeo
  const diferencia = Math.abs(data.monto - totalCalculado);
  return diferencia < 0.01;
}, {
  message: "El monto total no coincide con el cálculo de items",
  path: ["monto"]
});

// Esquemas para creación rápida de entidades relacionadas
export const quickClienteSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

export const quickProductoSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  precio: z.number().min(0, "Precio debe ser mayor o igual a 0"),
  cantidad: z.number().min(0, "Cantidad debe ser mayor o igual a 0"),
  descripcion: z.string().optional(),
});

export const quickServicioSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  precioBase: z.number().min(0, "Precio base debe ser mayor o igual a 0"),
  descripcion: z.string().optional(),
});

export type VentaFormData = z.infer<typeof ventaSchema>;
export type VentaProductoItem = z.infer<typeof ventaProductoItemSchema>;
export type VentaServicioItem = z.infer<typeof ventaServicioItemSchema>;
export type QuickClienteData = z.infer<typeof quickClienteSchema>;
export type QuickProductoData = z.infer<typeof quickProductoSchema>;
export type QuickServicioData = z.infer<typeof quickServicioSchema>;