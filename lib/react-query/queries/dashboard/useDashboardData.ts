// Nuevo archivo: lib/queries/useDashboardData.ts
import { DEFAULT_QUERY_OPTIONS } from "@/lib/react-query/options";
import { useQuery } from "@tanstack/react-query";

interface DashboardData {
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
      console.log("⌛ Fetching DashboardDATA...");
      const res = await fetch(`/api/dashboard`);
      if (!res.ok) throw new Error("Error al obtener datos del dashboard");
      return res.json();
    },
    ...DEFAULT_QUERY_OPTIONS,
    enabled: !!userId,
  });
