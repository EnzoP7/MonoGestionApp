import { useQuery } from "@tanstack/react-query";
import { FinancialSummary } from "@/types/finanzas";

export function useFinanzas(userId: string) {
  return useQuery<FinancialSummary>({
    queryKey: ["finanzas", userId],
    queryFn: async () => {
      const res = await fetch("/api/finanzas");
      if (!res.ok) {
        throw new Error("Error al obtener datos financieros");
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos - datos financieros no cambian tan frecuentemente
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}