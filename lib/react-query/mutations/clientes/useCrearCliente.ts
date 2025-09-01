import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { CreateClienteRequest, ClienteWithVentasCount } from "@/types/cliente";

export const useCrearCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClienteRequest): Promise<ClienteWithVentasCount> => {
      const response = await axios.post("/api/clientes", data);
      return response.data;
    },
    onSuccess: (newCliente) => {
      // Invalidar y refetch la lista de clientes
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      
      // Opcionalmente, actualizar la cache con el nuevo cliente
      queryClient.setQueryData<ClienteWithVentasCount[]>(["clientes"], (oldData) => {
        if (!oldData) return [newCliente];
        return [newCliente, ...oldData];
      });

      toast.success("Cliente creado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear el cliente";
      toast.error(errorMessage);
    },
  });
};