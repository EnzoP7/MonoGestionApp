import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { QuickProductoData } from "@/lib/validators/venta";
import type { Producto } from "@prisma/client";

export const useQuickCreateProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickProductoData): Promise<Producto> => {
      const response = await axios.post("/api/quick-create/producto", data);
      return response.data;
    },
    onSuccess: (newProducto) => {
      // Invalidar la cache de productos
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      
      toast.success("Producto creado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear el producto";
      toast.error(errorMessage);
    },
  });
};