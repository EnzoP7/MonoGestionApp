import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { ProductoParaCompra } from "@/types/compra";

interface EditarCompraPayload {
  id: string;
  userId: string;
  fecha: string;
  descripcion?: string;
  proveedorId?: string;
  monto: number;
  productos: ProductoParaCompra[];
}

export function useEditarCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EditarCompraPayload) => {
      try {
        const res = await axios.put(
          `/api/compras/${data.userId}/${data.id}`,
          data
        );
        return res.data;
      } catch (error: any) {
        console.error("[EDITAR_COMPRA_ERROR]", error);
        throw new Error(
          error?.response?.data?.error || "Error al editar la compra"
        );
      }
    },
    onSuccess: (_data, variables) => {
      toast.success("La compra fue actualizada correctamente");

      queryClient.invalidateQueries({
        queryKey: ["compras", variables.userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Ocurrió un error inesperado");
    },
  });
}
