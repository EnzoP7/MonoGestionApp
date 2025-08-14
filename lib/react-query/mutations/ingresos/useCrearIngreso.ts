import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type CrearIngresoInput = {
  userId: string;
  form: {
    fecha: string;
    monto: string;
    descripcion?: string;
    categoriaIngresoId?: string;
  };
  onSuccess?: () => void;
};

export function useCrearIngreso({
  userId,
  form,
  onSuccess,
}: CrearIngresoInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ingresos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear el ingreso");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      toast.success("Ingreso creado exitosamente");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}