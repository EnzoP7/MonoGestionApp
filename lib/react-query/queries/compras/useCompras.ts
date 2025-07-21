import { useQuery } from "@tanstack/react-query";
import { CompraConProveedor } from "@/types/compra";

export function useCompras(userId: string) {
  return useQuery<CompraConProveedor[]>({
    queryKey: ["compras", userId],
    queryFn: async () => {
      const res = await fetch(`/api/compras/${userId}`);
      if (!res.ok) throw new Error("Error al obtener las compras");
      return res.json();
    },
  });
}
