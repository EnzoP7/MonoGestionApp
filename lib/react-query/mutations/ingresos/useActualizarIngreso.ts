import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ActualizarIngresoInput = {
  userId: string;
  ingresoId: string;
  form: {
    fecha: string;
    monto: string;
    descripcion?: string;
    categoriaIngresoId?: string;
  };
  onSuccess?: () => void;
};

export function useActualizarIngreso({
  userId,
  ingresoId,
  form,
  onSuccess,
}: ActualizarIngresoInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ingresos/${ingresoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar el ingreso");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      toast.success("Ingreso actualizado exitosamente");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}