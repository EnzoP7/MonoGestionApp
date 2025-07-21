import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Proveedor } from "@/types/proveedor";

// interface CreateProveedorInput {
//   userId: string;
//   nombre: string;
//   telefono?: string;
//   email?: string;
//   direccion?: string;
//   descripcion?: string;
// }

export function useCreateProveedor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Proveedor) => axios.post("/api/proveedores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores", userId] });
    },
  });
}
