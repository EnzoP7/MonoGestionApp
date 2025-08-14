import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EgresoForm } from "@/types/egreso";

interface Params {
  userId: string;
  onSuccess?: () => void;
}

export function useCrearEgreso({ userId, onSuccess }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EgresoForm) => {
      const response = await fetch("/api/egresos/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear el egreso");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["egresos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      toast.success("Egreso creado exitosamente");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}