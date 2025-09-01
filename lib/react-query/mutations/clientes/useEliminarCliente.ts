import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { ClienteWithVentasCount } from "@/types/cliente";

export const useEliminarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/clientes/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.removeQueries({ queryKey: ["cliente", deletedId] });
      
      // Remover de la cache de la lista de clientes
      queryClient.setQueryData<ClienteWithVentasCount[]>(["clientes"], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((cliente) => cliente.id !== deletedId);
      });

      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al eliminar el cliente";
      const errorDetails = error.response?.data?.details;
      
      if (errorDetails) {
        toast.error(`${errorMessage}: ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });
};