import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ClienteWithVentas } from "@/types/cliente";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useCliente = (id: string) => {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: async (): Promise<ClienteWithVentas> => {
      const { data } = await axios.get(`/api/clientes/${id}`);
      return data;
    },
    enabled: !!id,
    ...DEFAULT_QUERY_OPTIONS,
  });
};