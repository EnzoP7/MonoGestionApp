import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface UseEliminarServicioProps {
  userId: string;
}

export function useEliminarServicio({ userId }: UseEliminarServicioProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (servicioId: string) => {
      const response = await axios.delete(`/api/servicios/${servicioId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios", userId] });
      toast.success("Servicio eliminado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error al eliminar servicio:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar el servicio"
      );
    },
  });
}