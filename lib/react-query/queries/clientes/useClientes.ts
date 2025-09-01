import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ClienteWithVentasCount } from "@/types/cliente";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useClientes = () => {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async (): Promise<ClienteWithVentasCount[]> => {
      const { data } = await axios.get("/api/clientes");
      return data;
    },
    ...DEFAULT_QUERY_OPTIONS,
  });
};