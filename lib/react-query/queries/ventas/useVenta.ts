import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { VentaWithDetails } from "@/types/venta";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useVenta = (id: string) => {
  return useQuery({
    queryKey: ["venta", id],
    queryFn: async (): Promise<VentaWithDetails> => {
      const { data } = await axios.get(`/api/ventas/${id}`);
      return data;
    },
    enabled: !!id,
    ...DEFAULT_QUERY_OPTIONS,
  });
};