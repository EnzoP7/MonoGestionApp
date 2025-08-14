import { useMutation, useQueryClient } from "@tanstack/react-query";

// Permitir string vacío en el formulario
interface CrearCategoriaForm {
  nombre: string;
  tipo: string;
  tipoCategoria: "" | "Ingreso" | "Egreso";
}

interface CrearCategoriaParams {
  userId: string;
  form: CrearCategoriaForm;
  onSuccess?: () => void;
}

async function crearCategoria(userId: string, form: CrearCategoriaForm) {
  // Validar que tipoCategoria no esté vacío antes de enviar
  if (!form.tipoCategoria) {
    throw new Error("Debe seleccionar el tipo de categoría");
  }

  const response = await fetch("/api/categorias", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      nombre: form.nombre,
      tipo: form.tipo,
      tipoCategoria: form.tipoCategoria,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear categoría");
  }

  return response.json();
}

export function useCrearCategoria({
  userId,
  form,
  onSuccess,
}: CrearCategoriaParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => crearCategoria(userId, form),
    onSuccess: () => {
      // Invalidar las consultas de categorías para refrescar la lista
      queryClient.invalidateQueries({
        queryKey: ["categorias", userId],
      });

      // También invalidar las categorías específicas si existen
      queryClient.invalidateQueries({
        queryKey: ["categorias-ingreso", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["categorias-egreso", userId],
      });

      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error al crear categoría:", error);
    },
  });
}
