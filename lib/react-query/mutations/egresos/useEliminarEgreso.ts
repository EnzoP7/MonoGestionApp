import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Params {
  userId: string;
  onSuccess?: () => void;
}

export function useEliminarEgreso({ userId, onSuccess }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (egresoId: string) => {
      const res = await fetch(`/api/egresos/${egresoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar el egreso");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["egresos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      toast.success("Egreso eliminado exitosamente");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}