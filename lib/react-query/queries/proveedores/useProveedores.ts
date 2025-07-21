import { useQuery } from "@tanstack/react-query";
import { Proveedor } from "@/types/proveedor";

export const useProveedores = (userId: string) => {
  return useQuery<Proveedor[]>({
    queryKey: ["proveedores", userId],
    queryFn: async () => {
      const res = await fetch(`/api/proveedores?userId=${userId}`);
      if (!res.ok) throw new Error("Error al cargar proveedores");
      return res.json();
    },
  });
};
