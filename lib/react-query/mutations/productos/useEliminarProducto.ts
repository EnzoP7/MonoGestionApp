import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Params {
  userId: string;
  onSuccess?: () => void;
}

export function useEliminarProducto({ userId, onSuccess }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productoId: string) => {
      const res = await fetch(`/api/productos/${productoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar el producto");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos", userId] });
      if (onSuccess) onSuccess();
    },
  });
}
