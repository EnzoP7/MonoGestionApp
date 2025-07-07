export type Producto = {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string | null; // ✅ este es el cambio necesario
  precio: number;
  cantidad: number;
  activo: boolean;
  createdAt: Date;
};
