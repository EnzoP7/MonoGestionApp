import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { UpdateServicioData } from "@/types/servicio";

interface UseActualizarServicioProps {
  userId: string;
}

export function useActualizarServicio({ userId }: UseActualizarServicioProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServicioData }) => {
      const response = await axios.put(`/api/servicios/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios", userId] });
      queryClient.invalidateQueries({ queryKey: ["servicio"] });
      toast.success("Servicio actualizado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error al actualizar servicio:", error);
      toast.error(
        error.response?.data?.message || "Error al actualizar el servicio"
      );
    },
  });
}