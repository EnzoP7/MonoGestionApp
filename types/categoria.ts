export interface CategoriaIngreso {
  id: string;
  userId: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
}

export interface CategoriaEgreso {
  id: string;
  userId: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
}

// Tipo unificado para el frontend
export interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
  tipoCategoria: "Ingreso" | "Egreso";
}

// Para formularios
export interface CategoriaForm {
  nombre: string;
  tipo: string;
  tipoCategoria: "Ingreso" | "Egreso";
}
