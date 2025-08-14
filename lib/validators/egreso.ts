import { z } from "zod";

export const egresoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  monto: z.string().min(1, "El monto es requerido"),
  categoria: z.string().min(1, "La categoría es requerida"),
  descripcion: z.string().optional(),
  categoriaEgresoId: z.string().optional(),
});

export type EgresoFormData = z.infer<typeof egresoSchema>;