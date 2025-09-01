import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { VentaWithDetails } from "@/types/venta";

export const useEliminarVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/ventas/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] }); // Para restaurar stock
      queryClient.invalidateQueries({ queryKey: ["movimientos"] }); // Para tracking financiero
      queryClient.removeQueries({ queryKey: ["venta", deletedId] });
      
      // Remover de la cache de la lista de ventas
      queryClient.setQueryData<VentaWithDetails[]>(["ventas"], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((venta) => venta.id !== deletedId);
      });

      toast.success("Venta eliminada exitosamente y stock restaurado");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al eliminar la venta";
      toast.error(errorMessage);
    },
  });
};