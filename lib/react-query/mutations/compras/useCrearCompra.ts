import { ProductoParaCompra } from "@/types/compra";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CrearCompraInput {
  proveedorId: string;
  fecha: string;
  descripcion?: string;
  productos: ProductoParaCompra[]; // ✅ Usamos el tipo correcto aquí
}

export function useCrearCompra({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearCompraInput) => {
      const res = await fetch(`/api/compras/${userId}`, {
        method: "POST",
        body: JSON.stringify({ ...data, userId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear la compra.");
      }

      return res.json();
    },
    onSuccess: () => {
      toast("La compra fue guardada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["compras", userId] });
    },
    onError: () => {
      toast("Error al registrar compra");
    },
  });
}
