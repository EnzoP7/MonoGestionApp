import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { VentaWithDetails } from "@/types/venta";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useVentas = () => {
  return useQuery({
    queryKey: ["ventas"],
    queryFn: async (): Promise<VentaWithDetails[]> => {
      const { data } = await axios.get("/api/ventas");
      return data;
    },
    ...DEFAULT_QUERY_OPTIONS,
  });
};