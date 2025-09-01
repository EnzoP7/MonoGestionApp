import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { QuickClienteData } from "@/lib/validators/venta";
import type { Cliente } from "@prisma/client";

export const useQuickCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickClienteData): Promise<Cliente> => {
      const response = await axios.post("/api/quick-create/cliente", data);
      return response.data;
    },
    onSuccess: (newCliente) => {
      // Invalidar la cache de clientes
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      
      toast.success("Cliente creado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear el cliente";
      toast.error(errorMessage);
    },
  });
};