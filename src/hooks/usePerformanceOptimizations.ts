import React, { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Custom hook for performance optimizations
 */
export const usePerformanceOptimizations = () => {
  // Debounced search function
  const useDebouncedSearch = (callback: (value: string) => void, delay: number = 300) => {
    const timeoutRef = useRef<NodeJS.Timeout>();

    const debouncedCallback = useCallback((value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(value), delay);
    }, [callback, delay]);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return debouncedCallback;
  };

  // Virtual scrolling for large lists
  const useVirtualScrolling = (itemHeight: number, containerHeight: number, items: any[]) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const visibleItems = useMemo(() => {
      const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
      return items.slice(0, visibleCount);
    }, [items, itemHeight, containerHeight]);

    return {
      containerRef,
      visibleItems
    };
  };

  // Memoized callbacks
  const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
    return useCallback(callback, []);
  };

  // Image lazy loading
  const useImageLazyLoading = () => {
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const img = imageRef.current;
      if (!img) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute('data-src');
                observer.unobserve(target);
              }
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(img);

      return () => {
        observer.disconnect();
      };
    }, []);

    return imageRef;
  };

  return {
    useDebouncedSearch,
    useVirtualScrolling,
    useStableCallback,
    useImageLazyLoading
  };
};

// Memoized components helpers
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, propsAreEqual);
};

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (import.meta.env.DEV && renderTime > 16) { // 16ms = 60fps threshold
        console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  const measureFunction = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    functionName: string
  ): T => {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (import.meta.env.DEV && end - start > 5) {
        console.log(`🔍 ${componentName}.${functionName}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  }, [componentName]);

  return { measureFunction };
};

export default usePerformanceOptimizations;