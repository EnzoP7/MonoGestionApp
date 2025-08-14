import { useQuery } from "@tanstack/react-query";

export function useMovimientos(userId: string) {
  return useQuery({
    queryKey: ["movimientos", userId],
    queryFn: async () => {
      const res = await fetch("/api/movimientos");
      if (!res.ok) {
        throw new Error("Error al obtener los movimientos");
      }
      return res.json();
    },
    enabled: !!userId,
  });
}