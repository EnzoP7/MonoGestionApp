import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .trim(),
  telefono: z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        // Validar formato de teléfono argentino básico
        const phoneRegex = /^(\+54|0)?[\s-]?(\d{2,4})[\s-]?(\d{6,8})$/;
        return phoneRegex.test(value.trim());
      },
      "Formato de teléfono inválido (ej: +54 11 1234-5678 o 011 1234-5678)"
    )
    .transform((value) => value?.trim() || "")
    .optional()
    .default(""),
  email: z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
      },
      "Formato de email inválido"
    )
    .transform((value) => value?.trim().toLowerCase() || "")
    .optional()
    .default(""),
  direccion: z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        return value.trim().length >= 5;
      },
      "La dirección debe tener al menos 5 caracteres"
    )
    .transform((value) => value?.trim() || "")
    .optional()
    .default(""),
});

export const createClienteSchema = clienteSchema;
export const updateClienteSchema = clienteSchema.partial();

export type ClienteFormData = z.infer<typeof clienteSchema>;
export type CreateClienteData = z.infer<typeof createClienteSchema>;
export type UpdateClienteData = z.infer<typeof updateClienteSchema>;