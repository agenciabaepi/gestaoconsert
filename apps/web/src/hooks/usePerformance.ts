import { useEffect, useRef, useCallback, useMemo, useState } from 'react';

/**
 * Hook para otimizar performance de componentes
 * Útil para sistemas com múltiplos usuários simultâneos
 */

interface PerformanceConfig {
  debounceDelay?: number;
  throttleDelay?: number;
  maxRetries?: number;
  retryDelay?: number;
  cacheTime?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export function usePerformance<T = any>(config: PerformanceConfig = {}) {
  const {
    debounceDelay = 300,
    throttleDelay = 1000,
    maxRetries = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000 // 5 minutos
  } = config;

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const throttleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryCounts = useRef<Map<string, number>>(new Map());

  // Limpar cache expirado
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cache.current.entries()) {
      if (now > entry.expiresAt) {
        cache.current.delete(key);
      }
    }
  }, []);

  // Debounce function
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    key: string
  ): T => {
    return ((...args: Parameters<T>) => {
      // Limpar timer anterior
      if (debounceTimers.current.has(key)) {
        clearTimeout(debounceTimers.current.get(key)!);
      }

      // Criar novo timer
      const timer = setTimeout(() => {
        func(...args);
        debounceTimers.current.delete(key);
      }, debounceDelay);

      debounceTimers.current.set(key, timer);
    }) as T;
  }, [debounceDelay]);

  // Throttle function
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    key: string
  ): T => {
    return ((...args: Parameters<T>) => {
      if (throttleTimers.current.has(key)) {
        return; // Já executando
      }

      func(...args);

      const timer = setTimeout(() => {
        throttleTimers.current.delete(key);
      }, throttleDelay);

      throttleTimers.current.set(key, timer);
    }) as T;
  }, [throttleDelay]);

  // Cache function
  const getCached = useCallback((key: string): T | null => {
    cleanupCache();
    const entry = cache.current.get(key);
    return entry ? entry.data : null;
  }, [cleanupCache]);

  const setCached = useCallback((key: string, data: T) => {
    const now = Date.now();
    cache.current.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTime
    });
  }, [cacheTime]);

  // Retry function
  const withRetry = useCallback(async <T>(
    func: () => Promise<T>,
    key: string
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await func();
        retryCounts.current.delete(key);
        return result;
      } catch (error) {
        lastError = error as Error;
        retryCounts.current.set(key, attempt);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError!;
  }, [maxRetries, retryDelay]);

  // Lazy loading
  const lazyLoad = useCallback((key: string, loader: () => Promise<T>) => {
    const cached = getCached(key);
    if (cached) {
      return Promise.resolve(cached);
    }

    return loader().then(data => {
      setCached(key, data);
      return data;
    });
  }, [getCached, setCached]);

  // Performance monitoring
  const measurePerformance = useCallback((name: string, func: () => any) => {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Limpar todos os timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      throttleTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
      throttleTimers.current.clear();
      retryCounts.current.clear();
    };
  }, []);

  // Auto cleanup cache
  useEffect(() => {
    const interval = setInterval(cleanupCache, cacheTime);
    return () => clearInterval(interval);
  }, [cleanupCache, cacheTime]);

  return {
    debounce,
    throttle,
    getCached,
    setCached,
    withRetry,
    lazyLoad,
    measurePerformance,
    cleanupCache
  };
}

/**
 * Hook para otimizar queries do Supabase
 */
export function useOptimizedQuery() {
  const { debounce, throttle, getCached, setCached, withRetry } = usePerformance();

  const optimizedQuery = useCallback(async <T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    options: {
      useCache?: boolean;
      useDebounce?: boolean;
      useThrottle?: boolean;
      useRetry?: boolean;
      debounceKey?: string;
      throttleKey?: string;
    } = {}
  ) => {
    const {
      useCache = true,
      useDebounce = false,
      useThrottle = false,
      useRetry = true,
      debounceKey = cacheKey,
      throttleKey = cacheKey
    } = options;

    // Verificar cache primeiro
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Função base da query
    const executeQuery = async (): Promise<T> => {
      const result = await queryFn();
      if (useCache) {
        setCached(cacheKey, result);
      }
      return result;
    };

    // Aplicar otimizações
    let optimizedQuery = executeQuery;

    if (useRetry) {
      optimizedQuery = () => withRetry(executeQuery, cacheKey);
    }

    if (useDebounce) {
      optimizedQuery = debounce(optimizedQuery, debounceKey);
    }

    if (useThrottle) {
      optimizedQuery = throttle(optimizedQuery, throttleKey);
    }

    return optimizedQuery();
  }, [debounce, throttle, getCached, setCached, withRetry]);

  return { optimizedQuery };
}

/**
 * Hook para otimizar renderização de listas
 */
export function useOptimizedList<T>(
  items: T[],
  options: {
    pageSize?: number;
    virtualScroll?: boolean;
    debounceSearch?: boolean;
  } = {}
) {
  const { pageSize = 20, virtualScroll = false, debounceSearch = true } = options;
  const { debounce } = usePerformance();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);

  // Debounced search
  const debouncedSetSearchTerm = useMemo(
    () => debounce(setSearchTerm, 'search'),
    [debounce]
  );

  // Paginação
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, pageSize]);

  // Filtro otimizado
  const filterItems = useCallback((term: string, filterFn?: (item: T, term: string) => boolean) => {
    if (!term) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => 
      filterFn ? filterFn(item, term) : 
      JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
    );

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset para primeira página
  }, [items]);

  // Search handler
  const handleSearch = useCallback((term: string) => {
    if (debounceSearch) {
      debouncedSetSearchTerm(term);
    } else {
      setSearchTerm(term);
    }
    filterItems(term);
  }, [debounceSearch, debouncedSetSearchTerm, filterItems]);

  return {
    items: paginatedItems,
    totalItems: filteredItems.length,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm: handleSearch,
    totalPages: Math.ceil(filteredItems.length / pageSize),
    hasNextPage: currentPage < Math.ceil(filteredItems.length / pageSize),
    hasPrevPage: currentPage > 1
  };
}
