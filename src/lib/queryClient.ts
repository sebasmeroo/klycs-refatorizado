import { QueryClient } from '@tanstack/react-query';

// ✅ Configuración optimizada de React Query para reducir lecturas de Firestore
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos (reduce lecturas repetidas)
      staleTime: 5 * 60 * 1000,

      // Mantener en cache por 10 minutos
      cacheTime: 10 * 60 * 1000,

      // Refetch solo cuando la ventana recupera foco (no automático)
      refetchOnWindowFocus: false,

      // No refetch al reconectar (evita lecturas innecesarias)
      refetchOnReconnect: false,

      // Reintentar solo 1 vez en caso de error
      retry: 1,

      // Mostrar datos del cache mientras revalida en background
      refetchOnMount: 'always',
    },
  },
});

// ✅ Función helper para invalidar cache manualmente
export const invalidateQueries = (keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

// ✅ Función para pre-cargar datos (prefetch)
export const prefetchQuery = async (
  key: string[],
  fn: () => Promise<any>
) => {
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fn,
  });
};
