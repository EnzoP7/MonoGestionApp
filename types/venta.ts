import type { Venta, Cliente, VentaProducto, VentaServicio, Producto, Servicio } from "@prisma/client";

export type VentaWithDetails = Venta & {
  cliente: Cliente | null;
  VentaProducto: (VentaProducto & {
    producto: Producto;
  })[];
  servicios: (VentaServicio & {
    servicio: Servicio;
  })[];
};

export interface VentaTableData {
  id: string;
  fecha: Date;
  clienteNombre: string | null;
  tipo: string;
  monto: number;
  totalItems: number;
  createdAt: Date;
}

export interface CreateVentaRequest {
  clienteId?: string | null;
  fecha: string | Date;
  tipo: "producto" | "servicio" | "mixta";
  monto: number;
  productos?: Array<{
    productoId: string;
    cantidad: number;
    precio: number;
  }>;
  servicios?: Array<{
    servicioId: string;
    cantidad: number;
    precio: number;
  }>;
}

export interface VentaFormItem {
  id: string;
  type: "producto" | "servicio";
  name: string;
  price: number;
  quantity: number;
  stock?: number; // Solo para productos
  subtotal: number;
}

// Para los selectores de productos/servicios
export interface ProductoOption {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number; // stock
  descripcion?: string;
}

export interface ServicioOption {
  id: string;
  nombre: string;
  precioBase: number | null;
  descripcion?: string;
}

export interface ClienteOption {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
}

// Para estadísticas
export interface VentaStats {
  totalVentas: number;
  ventasHoy: number;
  montoTotal: number;
  montoHoy: number;
  ventaPromedio: number;
}