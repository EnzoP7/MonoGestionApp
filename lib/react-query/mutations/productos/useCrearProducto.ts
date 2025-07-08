// lib/mutations/useCrearProducto.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type CrearProductoInput = {
  userId: string;
  form: {
    nombre: string;
    descripcion?: string;
    precio: string;
    cantidad: string;
    activo: boolean;
  };
  onSuccess?: () => void;
};

export function useCrearProducto({
  userId,
  form,
  onSuccess,
}: CrearProductoInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/productos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precio: parseFloat(form.precio),
          cantidad: parseInt(form.cantidad),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear el producto");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
      onSuccess?.(); // si pasás un callback, lo ejecuta
    },
    onError: (error: any) => {
      toast(error.message);
    },
  });
}
