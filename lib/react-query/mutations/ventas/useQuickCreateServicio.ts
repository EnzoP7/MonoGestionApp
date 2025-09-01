import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { QuickServicioData } from "@/lib/validators/venta";
import type { Servicio } from "@prisma/client";

export const useQuickCreateServicio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickServicioData): Promise<Servicio> => {
      const response = await axios.post("/api/quick-create/servicio", data);
      return response.data;
    },
    onSuccess: (newServicio) => {
      // Invalidar la cache de servicios
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      
      toast.success("Servicio creado exitosamente");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear el servicio";
      toast.error(errorMessage);
    },
  });
};