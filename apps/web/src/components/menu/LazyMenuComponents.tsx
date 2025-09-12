'use client';

import { lazy } from 'react';

// Componentes lazy para diferentes seções do menu
export const LazyFinanceiroMenu = lazy(() => 
  import('./sections/FinanceiroMenuSection').catch(() => ({
    default: () => <div>Erro ao carregar seção financeiro</div>
  }))
);

export const LazyRelatoriosMenu = lazy(() => 
  import('./sections/RelatoriosMenuSection').catch(() => ({
    default: () => <div>Erro ao carregar relatórios</div>
  }))
);

export const LazyConfiguracoesMenu = lazy(() => 
  import('./sections/ConfiguracoesMenuSection').catch(() => ({
    default: () => <div>Erro ao carregar configurações</div>
  }))
);

export const LazyAdminMenu = lazy(() => 
  import('./sections/AdminMenuSection').catch(() => ({
    default: () => <div>Erro ao carregar admin</div>
  }))
);