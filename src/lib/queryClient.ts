import { QueryClient } from '@tanstack/react-query';
import { PersistentCache } from '@/utils/persistentCache';

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

// ✅ Integrar cache persistente en React Query
// Cuando React Query actualiza datos, también los guardamos en localStorage
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event.query.state.data) {
    const queryKey = event.query.queryKey;
    const data = event.query.state.data;

    // Solo persistir queries específicas (no todas)
    if (queryKey[0] === 'cards' || queryKey[0] === 'calendars' || queryKey[0] === 'professionals') {
      const cacheKey = queryKey.join(':') as any;
      PersistentCache.set(cacheKey, data);
    }
  }
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
