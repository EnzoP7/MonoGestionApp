import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getProductosCached = unstable_cache(
  async (userId: string) => {
    return await prisma.producto.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
  (userId: string) => [`productos:${userId}`],
  {
    tags: (userId: string) => [`productos:${userId}`],
  }
);
