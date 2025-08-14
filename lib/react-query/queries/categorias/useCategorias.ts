import { useQuery } from "@tanstack/react-query";

interface CategoriaIngreso {
  id: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
}

interface CategoriaEgreso {
  id: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
}

// Tipo unificado
interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  createdAt: Date;
  tipoCategoria: "Ingreso" | "Egreso";
}

async function fetchCategorias(userId: string): Promise<Categoria[]> {
  const response = await fetch(`/api/categorias?userId=${userId}`);
  if (!response.ok) {
    throw new Error("Error al obtener categorías");
  }

  const data = await response.json();

  // Unificar ambos arrays añadiendo el campo tipoCategoria
  const categoriasUnificadas: Categoria[] = [
    ...data.categoriasIngreso.map((cat: CategoriaIngreso) => ({
      ...cat,
      tipoCategoria: "Ingreso" as const,
    })),
    ...data.categoriasEgreso.map((cat: CategoriaEgreso) => ({
      ...cat,
      tipoCategoria: "Egreso" as const,
    })),
  ];

  // Ordenar por fecha de creación (más recientes primero)
  return categoriasUnificadas.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function useCategorias(userId: string) {
  return useQuery({
    queryKey: ["categorias", userId],
    queryFn: () => fetchCategorias(userId),
    enabled: !!userId,
  });
}
