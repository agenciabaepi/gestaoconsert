import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface MenuState {
  // Estados principais
  menuExpandido: boolean | null;
  menuRecolhido: boolean | null;
  mobileMenuOpen: boolean;
  mounted: boolean;
  
  // Estados de submenus
  financeiroExpanded: boolean;
  equipamentosExpanded: boolean;
  contatosExpanded: boolean;
  
  // Estados de UI
  searchTerm: string;
  showNotifications: boolean;
  showProfileModal: boolean;
}

export interface MenuActions {
  // Ações principais
  toggleMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Ações de submenus
  setFinanceiroExpanded: (expanded: boolean) => void;
  setEquipamentosExpanded: (expanded: boolean) => void;
  setContatosExpanded: (expanded: boolean) => void;
  
  // Ações de UI
  setSearchTerm: (term: string) => void;
  setShowNotifications: (show: boolean) => void;
  setShowProfileModal: (show: boolean) => void;
}

export function useMenuState() {
  const pathname = usePathname();
  
  // Estados principais
  const [menuExpandido, setMenuExpandido] = useState<boolean | null>(null);
  const [menuRecolhido, setMenuRecolhido] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Estados de submenus
  const [financeiroExpanded, setFinanceiroExpanded] = useState(false);
  const [equipamentosExpanded, setEquipamentosExpanded] = useState(false);
  const [contatosExpanded, setContatosExpanded] = useState(false);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Controlar montagem para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Carregar estado do localStorage após montagem
  useEffect(() => {
    if (!mounted) return;
    
    const storedExpandido = localStorage.getItem('menuExpandido') === 'true';
    const storedRecolhido = localStorage.getItem('menuRecolhido') === 'true';
    
    setMenuExpandido(storedExpandido);
    setMenuRecolhido(storedRecolhido);
  }, [mounted]);

  // Auto-expandir submenus baseado na rota atual
  useEffect(() => {
    // Expandir automaticamente se estiver na página de categorias
    if (pathname === '/equipamentos/categorias') {
      setEquipamentosExpanded(true);
    }
    
    // Expandir automaticamente se estiver nas páginas de contatos
    if (pathname === '/clientes' || pathname === '/fornecedores') {
      setContatosExpanded(true);
    }
    
    // Expandir automaticamente se estiver nas páginas financeiras
    if (pathname.startsWith('/financeiro/') || pathname === '/movimentacao-caixa') {
      setFinanceiroExpanded(true);
    }
  }, [pathname]);

  // Fechar dropdown quando clicar fora - com debounce
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuExpandido && !target.closest('.menu-dropdown')) {
        setMenuExpandido(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuExpandido]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current);
      }
    };
  }, []);

  // Ações com debounce
  const toggleMenu = useCallback(() => {
    // Debounce para evitar múltiplos cliques
    if (toggleTimeoutRef.current) {
      clearTimeout(toggleTimeoutRef.current);
    }
    
    toggleTimeoutRef.current = setTimeout(() => {
      const newState = !menuRecolhido;
      setMenuRecolhido(newState);
      localStorage.setItem('menuRecolhido', newState.toString());
    }, 50);
  }, [menuRecolhido]);

  const state: MenuState = {
    menuExpandido,
    menuRecolhido,
    mobileMenuOpen,
    mounted,
    financeiroExpanded,
    equipamentosExpanded,
    contatosExpanded,
    searchTerm,
    showNotifications,
    showProfileModal,
  };

  const actions: MenuActions = {
    toggleMenu,
    setMobileMenuOpen,
    setFinanceiroExpanded,
    setEquipamentosExpanded,
    setContatosExpanded,
    setSearchTerm,
    setShowNotifications,
    setShowProfileModal,
  };

  return {
    state,
    actions,
    refs: {
      menuRef,
      toggleTimeoutRef,
    },
  };
}