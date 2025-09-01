import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { CreateVentaRequest, VentaWithDetails } from "@/types/venta";

export const useCrearVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVentaRequest): Promise<VentaWithDetails> => {
      const response = await axios.post("/api/ventas", data);
      return response.data;
    },
    onSuccess: (newVenta) => {
      // Invalidar y refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] }); // Para actualizar stock
      queryClient.invalidateQueries({ queryKey: ["movimientos"] }); // Para tracking financiero
      
      // Opcionalmente, actualizar la cache con la nueva venta
      queryClient.setQueryData<VentaWithDetails[]>(["ventas"], (oldData) => {
        if (!oldData) return [newVenta];
        return [newVenta, ...oldData];
      });

      toast.success("Venta creada exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear la venta";
      const errorDetails = error.response?.data?.details;
      
      if (errorDetails) {
        toast.error(`${errorMessage}: ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });
};