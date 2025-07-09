import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Params {
  userId: string;
  productoId: string;
  form: {
    nombre: string;
    descripcion?: string;
    precio: string;
    cantidad: string;
    activo: boolean;
  };
  onSuccess?: () => void;
}

export function useActualizarProducto({
  userId,
  productoId,
  form,
  onSuccess,
}: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/productos/${productoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: parseFloat(form.precio),
          cantidad: parseInt(form.cantidad),
          activo: form.activo,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar producto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos", userId] });
      if (onSuccess) onSuccess();
    },
  });
}
