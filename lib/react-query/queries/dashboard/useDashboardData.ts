import { useQuery } from "@tanstack/react-query";

export interface DashboardData {
  totalIngresos: number;
  totalGastos: number;
  productosActivos: number;
  balance: number;
  growthRate: number | null;
  cantidadVentas: number;
}

export const useDashboardData = (userId: string) =>
  useQuery<DashboardData>({
    queryKey: ["dashboardData", userId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos en cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
