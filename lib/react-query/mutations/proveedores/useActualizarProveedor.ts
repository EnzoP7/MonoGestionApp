import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
interface UpdateProveedorInput {
  id: string;
  data: {
    nombre: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    descripcion?: string;
  };
}

export function useActualizarProveedor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateProveedorInput) =>
      axios.put(`/api/proveedores/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores", userId] });
    },
  });
}
