import { useCallback } from 'react';

export const usePageNavigation = () => {
  const navigateWithReload = useCallback((href: string) => {
    // Força recarregamento completo da página
    window.location.href = href;
  }, []);

  const navigateWithReplace = useCallback((href: string) => {
    // Substitui a entrada atual no histórico e recarrega
    window.location.replace(href);
  }, []);

  return {
    navigateWithReload,
    navigateWithReplace
  };
};