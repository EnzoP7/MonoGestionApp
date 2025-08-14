export interface Movimiento {
  id: string;
  userId: string;
  tipo: "Ingreso" | "Egreso" | "Venta" | "Compra";
  fecha: Date;
  monto: number;
  descripcion?: string;
  
  // Relaciones opcionales con las fuentes del movimiento
  ingresoId?: string;
  ingreso?: {
    id: string;
    descripcion?: string;
    categoriaIngreso?: {
      id: string;
      nombre: string;
    };
  };
  
  egresoId?: string;
  egreso?: {
    id: string;
    categoria: string;
    descripcion?: string;
    categoriaEgreso?: {
      id: string;
      nombre: string;
    };
  };
  
  compraId?: string;
  compra?: {
    id: string;
    descripcion?: string;
    proveedor?: {
      id: string;
      nombre: string;
    };
  };
  
  ventaId?: string;
  venta?: {
    id: string;
    tipo: string;
    cliente?: {
      id: string;
      nombre: string;
    };
  };
  
  createdAt: Date;
}