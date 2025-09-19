'use client';
import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface PageRefreshOptions {
  refreshOnNavigation?: boolean;
  refreshDelay?: number;
  excludePaths?: string[];
}

export const usePageRefresh = (options: PageRefreshOptions = {}) => {
  const {
    refreshOnNavigation = true,
    refreshDelay = 100,
    excludePaths = ['/login', '/']
  } = options;

  const pathname = usePathname();
  const router = useRouter();

  // ✅ Função para refresh inteligente da página
  const refreshPage = useCallback(() => {
    // Não fazer refresh em páginas excluídas
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return;
    }

    console.log('🔄 Fazendo refresh da página:', pathname);
    
    // Usar router.refresh() do Next.js ao invés de window.location.reload()
    router.refresh();
  }, [pathname, router, excludePaths]);

  // ✅ Refresh automático ao navegar (com delay)
  useEffect(() => {
    if (!refreshOnNavigation) return;

    const timeoutId = setTimeout(() => {
      console.log('🔄 Auto-refresh após navegação para:', pathname);
      refreshPage();
    }, refreshDelay);

    return () => clearTimeout(timeoutId);
  }, [pathname, refreshOnNavigation, refreshDelay, refreshPage]);

  return {
    refreshPage
  };
};
