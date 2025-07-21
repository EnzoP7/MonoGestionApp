import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useEliminarProveedor = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar proveedor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores", userId] });
    },
  });
};
