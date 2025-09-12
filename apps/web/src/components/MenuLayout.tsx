'use client';

import React, { useState, useEffect, memo, useCallback, useMemo, Suspense, lazy } from 'react';
import { useMenuState } from '@/hooks/useMenuState';
import { useAuth } from '@/context/AuthContext';
import SubscriptionStatus from './SubscriptionStatus';
import ProtectedArea from './ProtectedArea';
import { FiMenu, FiX } from 'react-icons/fi';
import { useRenderTracker } from '@/hooks/useRenderTracker';
import PerformanceMonitor from './PerformanceMonitor';
import Image from 'next/image';
import HeaderTop from './HeaderTop';
import MenuItems from './MenuItems';

// Lazy loading dos componentes pesados
const LazyMenuItems = lazy(() => import('./MenuItems'));
const LazySubscriptionStatus = lazy(() => import('./SubscriptionStatus'));

interface MenuLayoutProps {
  children: React.ReactNode;
}

// Componente do Header do Menu
const MenuHeader = memo(({
  menuRecolhido,
  onToggleMenu,
  isMobile,
  showToggleButton = true
}: {
  menuRecolhido: boolean;
  onToggleMenu: () => void;
  isMobile: boolean;
  showToggleButton?: boolean;
}) => (
  <div className="p-4 border-b border-gray-600 flex-shrink-0 bg-black">
    <div className="flex items-center justify-between">
      {/* Espaço vazio onde estava o logo */}
      <div className="flex-1" />
      
      {/* Botão de toggle - apenas no desktop */}
      {showToggleButton && (
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-150 flex-shrink-0"
          title={isMobile ? 'Fechar menu' : (menuRecolhido ? 'Expandir menu' : 'Recolher menu')}
        >
          {isMobile ? (
            <FiX className="w-5 h-5 text-white" />
          ) : menuRecolhido ? (
            <FiMenu className="w-5 h-5 text-white" />
          ) : (
            <FiX className="w-5 h-5 text-white" />
          )}
        </button>
      )}
    </div>
  </div>
));

MenuHeader.displayName = 'MenuHeader';

// Componente de Loading
const LoadingState = memo(() => (
  <div className="flex h-screen bg-white fixed inset-0">
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Carregando...</p>
      </div>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Hook para detectar mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const MenuLayout = React.memo<MenuLayoutProps>(({ children }) => {
  // Tracking de renderizações apenas em desenvolvimento
  useRenderTracker('MenuLayout');
  
  // Obter dados do usuário do contexto de autenticação
  const { usuarioData, loading: authLoading } = useAuth();
  
  // Detectar se é mobile
  const isMobile = useIsMobile();
  
  // Usar hook customizado para estado do menu
  const {
    state: {
      menuExpandido,
      menuRecolhido,
      mobileMenuOpen,
      mounted
    },
    actions: {
      toggleMenu,
      setMobileMenuOpen
    }
  } = useMenuState();

  // Memoizar callbacks para evitar re-renderizações
  const handleToggleMenu = useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      toggleMenu();
    }
  }, [isMobile, mobileMenuOpen, setMobileMenuOpen, toggleMenu]);

  // Fechar menu mobile quando clicar no overlay
  const handleOverlayClick = useCallback(() => {
    if (isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen, setMobileMenuOpen]);

  // Memoizar classes CSS para evitar recálculos
  const sidebarClasses = useMemo(() => {
    if (isMobile) {
      return `bg-black shadow-lg transition-transform duration-300 ease-out flex flex-col fixed left-0 top-0 h-full w-80 z-50 transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`;
    }
    
    // Desktop: posição fixa para não empurrar o conteúdo
    return `bg-black shadow-lg transition-all duration-200 ease-out flex flex-col h-full fixed left-0 top-0 z-40 ${
      menuRecolhido ? 'w-16' : menuExpandido ? 'w-80' : 'w-64'
    }`;
  }, [isMobile, mobileMenuOpen, menuRecolhido, menuExpandido]);

  // CORREÇÃO: Simplificar condição de loading - remover verificação de usuarioData
  // O AuthContext já gerencia isso adequadamente
  if (!mounted || (authLoading && !usuarioData)) {
    return <LoadingState />;
  }

  return (
    <ProtectedArea area="menu">
      <div className="internal-page flex flex-col h-screen bg-gray-50 fixed inset-0 overflow-hidden">
        {/* Header Top com dados do usuário - fixo */}
        <div className="flex-shrink-0 z-40">
          <HeaderTop 
            onToggleMenu={isMobile ? handleToggleMenu : undefined}
            showMenuButton={isMobile}
          />
        </div>
        
        <div className="flex flex-1 relative overflow-hidden">
          {/* Overlay para mobile */}
          {isMobile && mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleOverlayClick}
            />
          )}
          
          {/* Sidebar responsiva */}
          <div className={sidebarClasses}>
            {/* Header do Menu - Logo e botão toggle */}
            <MenuHeader
              menuRecolhido={menuRecolhido}
              onToggleMenu={handleToggleMenu}
              isMobile={isMobile}
              showToggleButton={!isMobile}
            />

            {/* Itens do Menu - com scroll interno */}
            <div className="flex-1 overflow-y-auto">
              <MenuItems
                userRole={usuarioData?.nivel || 'tecnico'}
                empresaId={usuarioData?.empresa_id || ''}
                menuRecolhido={isMobile ? false : menuRecolhido}
              />
            </div>

            {/* Footer do Menu - Logo e Versão */}
            {(!menuRecolhido || isMobile) && (
              <div className="p-6 border-t border-gray-600 bg-black flex-shrink-0">
                <div className="text-center">
                  <div className="mb-3">
                    <Image 
                      src="/assets/imagens/logobranco.png" 
                      alt="Consert Logo" 
                      width={80} 
                      height={80}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Versão 2.5</p>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo Principal - responsivo */}
          <div className={`flex-1 overflow-y-auto transition-all duration-200 ${
            isMobile ? 'w-full' : (menuRecolhido ? 'ml-16' : menuExpandido ? 'ml-80' : 'ml-64')
          } pt-16`}>
            <div className="h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedArea>
  );
});

MenuLayout.displayName = 'MenuLayout';
export default MenuLayout;