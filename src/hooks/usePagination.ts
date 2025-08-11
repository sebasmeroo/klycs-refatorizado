import { useState, useCallback } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface PaginationState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  lastDoc?: QueryDocumentSnapshot;
}

interface PaginationResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

interface PaginationOptions<T> {
  fetchFunction: (lastDoc?: QueryDocumentSnapshot) => Promise<{
    success: boolean;
    data?: T[];
    hasMore?: boolean;
    lastDoc?: QueryDocumentSnapshot;
    error?: string;
  }>;
  pageSize?: number;
}

export function usePagination<T>({
  fetchFunction,
  pageSize = 10
}: PaginationOptions<T>): PaginationResult<T> {
  const [state, setState] = useState<PaginationState<T>>({
    items: [],
    loading: false,
    hasMore: true,
    error: null,
    lastDoc: undefined
  });

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction(state.lastDoc);
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          items: [...prev.items, ...result.data!],
          hasMore: result.hasMore || false,
          lastDoc: result.lastDoc,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Error loading data',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error loading data',
        loading: false
      }));
    }
  }, [fetchFunction, state.lastDoc, state.loading, state.hasMore]);

  const refresh = useCallback(async () => {
    setState({
      items: [],
      loading: false,
      hasMore: true,
      error: null,
      lastDoc: undefined
    });
    
    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await fetchFunction();
      
      if (result.success && result.data) {
        setState({
          items: result.data,
          hasMore: result.hasMore || false,
          lastDoc: result.lastDoc,
          loading: false,
          error: null
        });
      } else {
        setState({
          items: [],
          hasMore: false,
          lastDoc: undefined,
          loading: false,
          error: result.error || 'Error loading data'
        });
      }
    } catch (error) {
      setState({
        items: [],
        hasMore: false,
        lastDoc: undefined,
        loading: false,
        error: 'Error loading data'
      });
    }
  }, [fetchFunction]);

  const reset = useCallback(() => {
    setState({
      items: [],
      loading: false,
      hasMore: true,
      error: null,
      lastDoc: undefined
    });
  }, []);

  return {
    items: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    reset
  };
}