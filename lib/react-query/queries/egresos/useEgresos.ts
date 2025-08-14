import { useQuery } from "@tanstack/react-query";

export function useEgresos(userId: string) {
  return useQuery({
    queryKey: ["egresos", userId],
    queryFn: async () => {
      const res = await fetch("/api/egresos");
      if (!res.ok) {
        throw new Error("Error al obtener los egresos");
      }
      return res.json();
    },
    enabled: !!userId,
  });
}