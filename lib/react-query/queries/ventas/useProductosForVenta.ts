import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Producto } from "@prisma/client";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useProductosForVenta = () => {
  return useQuery({
    queryKey: ["productos"],
    queryFn: async (): Promise<Producto[]> => {
      const { data } = await axios.get("/api/productos");
      return data;
    },
    ...DEFAULT_QUERY_OPTIONS,
  });
};