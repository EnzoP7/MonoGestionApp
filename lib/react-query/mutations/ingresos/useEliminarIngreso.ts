import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Params {
  userId: string;
  onSuccess?: () => void;
}

export function useEliminarIngreso({ userId, onSuccess }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingresoId: string) => {
      const res = await fetch(`/api/ingresos/${ingresoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar el ingreso");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      toast.success("Ingreso eliminado exitosamente");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}