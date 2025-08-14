import { useQuery } from "@tanstack/react-query";

export function useIngresos(userId: string) {
  return useQuery({
    queryKey: ["ingresos", userId],
    queryFn: async () => {
      const res = await fetch("/api/ingresos");
      if (!res.ok) {
        throw new Error("Error al obtener los ingresos");
      }
      return res.json();
    },
    enabled: !!userId,
  });
}