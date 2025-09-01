export interface Servicio {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  precioBase?: number;
  createdAt: Date;
}

export interface CreateServicioData {
  nombre: string;
  descripcion?: string;
  precioBase?: number;
}

export interface UpdateServicioData {
  nombre?: string;
  descripcion?: string;
  precioBase?: number;
}

export interface ServicioConVentas extends Servicio {
  ventas: {
    id: string;
    ventaId: string;
    cantidad: number;
    precio: number;
    venta: {
      id: string;
      fecha: Date;
      cliente?: {
        id: string;
        nombre: string;
      };
    };
  }[];
}