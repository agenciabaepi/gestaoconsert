'use client';

import { useEffect } from 'react';

// Preloader inteligente que carrega componentes baseado na prioridade
const MenuPreloader = () => {
  useEffect(() => {
    // Preload de componentes críticos após o carregamento inicial
    const preloadCriticalComponents = async () => {
      try {
        // Aguardar um pouco para não interferir no carregamento inicial
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Preload dos componentes mais usados
        const componentPromises = [
          import('./MenuItems'),
          import('./SubscriptionStatus'),
          import('../app/dashboard/page'),
          import('../app/ordens/page')
        ];
        
        await Promise.all(componentPromises);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Componentes críticos pré-carregados');
        }
      } catch (error) {
        console.warn('Erro no preload de componentes:', error);
      }
    };

    preloadCriticalComponents();
  }, []);

  return null;
};

export default MenuPreloader;