// lib/react-query/options.ts

// Tiempo de 5 minutos  y evitar llamar denuevo al hacer reload
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
};
