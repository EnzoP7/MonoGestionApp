import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ActualizarCategoriaForm {
  nombre: string;
  tipo: string;
  tipoCategoria: "Ingreso" | "Egreso";
}

interface ActualizarCategoriaParams {
  userId: string;
  categoriaId: string;
  tipoCategoria: "Ingreso" | "Egreso";
  form: ActualizarCategoriaForm;
  onSuccess?: () => void;
}

async function actualizarCategoria(
  userId: string,
  categoriaId: string,
  tipoCategoria: "Ingreso" | "Egreso",
  form: ActualizarCategoriaForm
) {
  const response = await fetch(`/api/categorias/${categoriaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      nombre: form.nombre,
      tipo: form.tipo,
      tipoCategoria: form.tipoCategoria,
      tipoCategoriaOriginal: tipoCategoria, // Para saber de qué tabla viene
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar categoría");
  }

  return response.json();
}

export function useActualizarCategoria({
  userId,
  categoriaId,
  tipoCategoria,
  form,
  onSuccess,
}: ActualizarCategoriaParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      actualizarCategoria(userId, categoriaId, tipoCategoria, form),
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

      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error al actualizar categoría:", error);
    },
  });
}
