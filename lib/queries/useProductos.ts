// lib/queries/useProductos.ts
import { useQuery } from "@tanstack/react-query";
import { Producto } from "@/types/producto";
import { DEFAULT_QUERY_OPTIONS } from "../react-query/options";

export const useProductos = (userId: string) =>
  useQuery<Producto[]>({
    queryKey: ["productos", userId],
    queryFn: async () => {
      console.log("⌛ Fetching productos...");
      const res = await fetch(`/api/productos`);
      if (!res.ok) throw new Error("Error al obtener productos");
      return res.json();
    },
    ...DEFAULT_QUERY_OPTIONS,

    enabled: !!userId, // Solo ejecuta si hay userId
  });
