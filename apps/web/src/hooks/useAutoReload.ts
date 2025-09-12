'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function useAutoReload() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    // Se mudou de página e não é a primeira carga
    if (previousPathname.current && previousPathname.current !== pathname) {
      console.log('🔄 Auto-reload: Mudança de página detectada - RELOAD DIRETO');
      
      // Reload direto - o Next.js já mostra o loading
      window.location.reload();
    }
    
    // Atualizar referência
    previousPathname.current = pathname;
  }, [pathname]);
}
