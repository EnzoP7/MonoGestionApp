import { prisma } from "../prisma";

export async function getUserById(id: string) {
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
}
