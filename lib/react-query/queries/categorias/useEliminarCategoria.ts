import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EliminarCategoriaParams {
  userId: string;
}

interface EliminarCategoriaData {
  id: string;
  tipoCategoria: "Ingreso" | "Egreso";
}

async function eliminarCategoria(
  userId: string,
  { id, tipoCategoria }: EliminarCategoriaData
) {
  const response = await fetch(`/api/categorias/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      tipoCategoria,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar categoría");
  }

  return response.json();
}

export function useEliminarCategoria({ userId }: EliminarCategoriaParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EliminarCategoriaData) =>
      eliminarCategoria(userId, data),
    onSuccess: () => {
      // Invalidar todas las consultas de categorías
      queryClient.invalidateQueries({
        queryKey: ["categorias", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["categorias-ingreso", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["categorias-egreso", userId],
      });

      // También invalidar ingresos y egresos ya que pueden tener categorías asociadas
      queryClient.invalidateQueries({
        queryKey: ["ingresos", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["egresos", userId],
      });
    },
    onError: (error) => {
      console.error("Error al eliminar categoría:", error);
    },
  });
}
