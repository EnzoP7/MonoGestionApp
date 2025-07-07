import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "Nombre muy corto"),
  role: z.enum(["user", "admin"]).optional(), // opcional
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
