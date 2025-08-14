import { CategoriaEgreso } from "./categoria";

export interface Egreso {
  id: string;
  userId: string;
  fecha: Date;
  monto: number;
  categoria: string;
  descripcion?: string;
  categoriaEgresoId?: string;
  categoriaEgreso?: CategoriaEgreso;
  createdAt: Date;
}

export interface EgresoForm {
  fecha: string;
  monto: string;
  categoria: string;
  descripcion?: string;
  categoriaEgresoId?: string;
}