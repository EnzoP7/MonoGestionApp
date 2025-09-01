import type { Cliente, Venta } from "@prisma/client";

export type ClienteWithVentas = Cliente & {
  ventas: Venta[];
  _count: {
    ventas: number;
  };
};

export type ClienteWithVentasCount = Cliente & {
  _count: {
    ventas: number;
  };
};

export interface ClienteTableData {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  totalVentas: number;
  createdAt: Date;
}

export interface CreateClienteRequest {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface UpdateClienteRequest extends Partial<CreateClienteRequest> {}