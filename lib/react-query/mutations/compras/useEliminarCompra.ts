// lib/react-query/mutations/compras/useEliminarCompra.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEliminarCompra({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (compraId: string) => {
      const res = await fetch(`/api/compras/${userId}/${compraId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar la compra.");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Compra eliminada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["compras", userId] });
    },
    onError: (error: any) => {
      toast.error("Error al eliminar la compra");
      console.error("Error al eliminar compra:", error);
    },
  });
}
