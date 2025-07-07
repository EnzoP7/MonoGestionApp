import { prisma } from "../prisma";

// getProductos.ts (sin cache)
export async function getProductos(userId: string) {
  return await prisma.producto.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
