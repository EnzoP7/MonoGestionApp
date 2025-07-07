import { DEFAULT_QUERY_OPTIONS } from "@/lib/react-query/options";
import { useQuery } from "@tanstack/react-query";

interface VentaPorDia {
  date: string;
  ventas: number;
}

export const useVentasPorDia = (userId: string, dias: number) =>
  useQuery<VentaPorDia[]>({
    queryKey: ["ventasPorDia", userId, dias],
    queryFn: async () => {
      console.log("⌛ Fetching VENTAS...");
      const res = await fetch(
        `/api/dashboard/ventas?userId=${userId}&dias=${dias}`
      );
      if (!res.ok) throw new Error("Error al obtener datos de ventas");
      return res.json();
    },
    ...DEFAULT_QUERY_OPTIONS,

    enabled: !!userId && !!dias, // Solo ejecuta si hay userId y dias
  });
