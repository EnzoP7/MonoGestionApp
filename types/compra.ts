// types/compra.ts
import { CompraProducto } from "@prisma/client";
import { Proveedor } from "./proveedor";

export type Compra = {
  id: string;
  userId: string;
  proveedorId?: string;
  proveedor?: Proveedor;
  fecha: string;
  monto: number;
  descripcion?: string;
  createdAt: string;
  CompraProducto?: CompraProducto[];
};

export type ProductoParaCompra = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
};
export type CompraConProveedor = Compra & {
  proveedor: Proveedor | null;
  productos: CompraProducto[]; // <- esta línea falta
};
