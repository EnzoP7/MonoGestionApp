import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { UpdateClienteRequest, ClienteWithVentasCount } from "@/types/cliente";

interface UpdateClienteParams {
  id: string;
  data: UpdateClienteRequest;
}

export const useActualizarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateClienteParams): Promise<ClienteWithVentasCount> => {
      const response = await axios.put(`/api/clientes/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedCliente) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente", updatedCliente.id] });
      
      // Actualizar la cache de la lista de clientes
      queryClient.setQueryData<ClienteWithVentasCount[]>(["clientes"], (oldData) => {
        if (!oldData) return [updatedCliente];
        return oldData.map((cliente) =>
          cliente.id === updatedCliente.id ? updatedCliente : cliente
        );
      });

      toast.success("Cliente actualizado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al actualizar el cliente";
      toast.error(errorMessage);
    },
  });
};