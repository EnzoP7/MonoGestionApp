import { prisma } from "../prisma";
import { unstable_cache } from "next/cache";

// Función cacheada
export const getUserById = unstable_cache(
  async (id: string) => {
    if (!id || typeof id !== "string") {
      console.error("[getUserById] ID inválido recibido:", id);
      throw new Error("El ID del usuario es inválido o está vacío.");
    }

    console.log("[getUserById] Consultando BD por ID:", id);

    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  },
  // 👇 Esta función genera la clave de cache dinámicamente
  (id: string) => [`user:${id}`],
  {
    // 👇 También usamos una función para los tags dinámicos
    tags: (id: string) => [`user:${id}`],
  }
);
