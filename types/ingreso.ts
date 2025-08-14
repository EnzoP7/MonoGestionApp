import { CategoriaIngreso } from "./categoria";

export interface Ingreso {
  id: string;
  userId: string;
  fecha: Date;
  monto: number;
  descripcion?: string;
  categoriaIngresoId?: string;
  categoriaIngreso?: CategoriaIngreso;
  createdAt: Date;
}

export interface IngresoForm {
  fecha: string;
  monto: string;
  descripcion?: string;
  categoriaIngresoId?: string;
}