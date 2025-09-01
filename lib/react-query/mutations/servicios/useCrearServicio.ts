import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CreateServicioData } from "@/types/servicio";

interface UseCrearServicioProps {
  userId: string;
}

export function useCrearServicio({ userId }: UseCrearServicioProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServicioData) => {
      const response = await axios.post("/api/servicios", {
        ...data,
        userId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios", userId] });
      toast.success("Servicio creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error al crear servicio:", error);
      toast.error(
        error.response?.data?.message || "Error al crear el servicio"
      );
    },
  });
}