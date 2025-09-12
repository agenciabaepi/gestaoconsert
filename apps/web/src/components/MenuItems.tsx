'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useRenderTracker } from '@/hooks/useRenderTracker';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  TagIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  CalculatorIcon,
  BellIcon,
  StarIcon,
  CubeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { usePageNavigation } from '@/hooks/usePageNavigation';

interface MenuItemsProps {
  userRole: string;
  empresaId: string;
  menuRecolhido?: boolean;
  onItemClick?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  roles: string[];
  children?: MenuItem[];
}

const MenuItems = React.memo<MenuItemsProps>(({ 
  userRole, 
  empresaId, 
  menuRecolhido = false,
  onItemClick 
}) => {
  useRenderTracker('MenuItems', { userRole, empresaId, menuRecolhido });
  
  const pathname = usePathname();
  const { navigateWithReload } = usePageNavigation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Definição dos itens do menu com estrutura hierárquica
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <HomeIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'tecnico', 'atendente']
    },
    {
      id: 'ordens',
      label: 'Ordens de Serviço',
      href: '/ordens',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'tecnico', 'atendente']
    },
    {
      id: 'caixa',
      label: 'Caixa',
      href: '/caixa',
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'caixa']
    },
    {
      id: 'contatos',
      label: 'Contatos',
      icon: <UserGroupIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'atendente'],
      children: [
        {
          id: 'clientes',
          label: 'Clientes',
          href: '/clientes',
          icon: <UserGroupIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente', 'atendente']
        },
        {
          id: 'fornecedores',
          label: 'Fornecedores',
          href: '/fornecedores',
          icon: <BuildingOfficeIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente']
        }
      ]
    },
    {
      id: 'produtos',
      label: 'Produtos',
      href: '/equipamentos',
      icon: <CubeIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente']
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: <ChartBarIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'financeiro'],
      children: [
        {
          id: 'vendas',
          label: 'Vendas',
          href: '/financeiro/vendas',
          icon: <BanknotesIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente', 'financeiro']
        },
        {
          id: 'movimentacao-caixa',
          label: 'Movimentação Caixa',
          href: '/movimentacao-caixa',
          icon: <CalculatorIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente', 'financeiro']
        },
        {
          id: 'contas-pagar',
          label: 'Contas a Pagar',
          href: '/financeiro/contas-a-pagar',
          icon: <CreditCardIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente', 'financeiro']
        }
      ]
    },
    {
      id: 'bancada',
      label: 'Bancada',
      href: '/bancada',
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente', 'tecnico']
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente'],
      children: [
        {
          id: 'relatorios-gerais',
          label: 'Relatórios Gerais',
          href: '/relatorios',
          icon: <DocumentTextIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente']
        },
        {
          id: 'comissoes',
          label: 'Comissões',
          href: '/comissoes',
          icon: <CurrencyDollarIcon className="h-4 w-4" />,
          roles: ['admin', 'gerente', 'tecnico']
        }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      href: '/configuracoes',
      icon: <CogIcon className="h-5 w-5" />,
      roles: ['admin', 'gerente']
    }
  ];

  // Filtrar itens baseado no papel do usuário
  const filteredItems = useMemo(() => {
    const filterByRole = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        if (!item.roles.includes(userRole)) return false;
        
        if (item.children) {
          const filteredChildren = filterByRole(item.children);
          return filteredChildren.length > 0;
        }
        
        return true;
      }).map(item => ({
        ...item,
        children: item.children ? filterByRole(item.children) : undefined
      }));
    };
    
    return filterByRole(menuItems);
  }, [menuItems, userRole]);

  // Toggle de expansão de submenu
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Verificar se item está ativo
  const isActive = useCallback((href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }, [pathname]);

  // Função para navegar com recarregamento
  const handleNavigation = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Fechar menu mobile se necessário
    if (onItemClick) {
      onItemClick();
    }
    
    // Navegar com recarregamento completo
    navigateWithReload(href);
  }, [navigateWithReload, onItemClick]);

  // Renderizar item do menu
  const renderMenuItem = useCallback((item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.href === pathname;
    const hasPermission = item.roles.includes(userRole) || userRole === 'admin';

    if (!hasPermission) return null;

    const paddingLeft = menuRecolhido ? 'pl-3' : `pl-${4 + level * 2}`;
    const iconSize = level > 0 ? 'h-4 w-4' : 'h-5 w-5';

    return (
      <div key={item.id} className="mb-1">
        {item.href ? (
          // Item com link - usar navegação com recarregamento
          <a
            href={item.href}
            onClick={(e) => handleNavigation(item.href!, e)}
            className={`
              flex items-center ${paddingLeft} py-3 text-sm font-medium rounded-lg transition-all duration-150
              ${isActive 
                ? 'bg-gray-800 text-white border-l-4 border-[#D1FE6E]' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
              ${menuRecolhido ? 'justify-center' : 'justify-start'}
            `}
            title={menuRecolhido ? item.label : undefined}
          >
            <span className={`${iconSize} ${menuRecolhido ? '' : 'mr-3'} flex-shrink-0`}>
              {item.icon}
            </span>
            {!menuRecolhido && (
              <span className="truncate">{item.label}</span>
            )}
          </a>
        ) : (
          // Item com submenu
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`
              w-full flex items-center ${paddingLeft} py-3 text-sm font-medium rounded-lg transition-all duration-150
              text-gray-300 hover:bg-gray-800 hover:text-white
              ${menuRecolhido ? 'justify-center' : 'justify-between'}
            `}
            title={menuRecolhido ? item.label : undefined}
          >
            <div className={`flex items-center ${menuRecolhido ? '' : 'flex-1'}`}>
              <span className={`${iconSize} ${menuRecolhido ? '' : 'mr-3'} flex-shrink-0`}>
                {item.icon}
              </span>
              {!menuRecolhido && (
                <span className="truncate">{item.label}</span>
              )}
            </div>
            {!menuRecolhido && hasChildren && (
              <span className="ml-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </span>
            )}
          </button>
        )}

        {/* Renderizar filhos se expandido */}
        {hasChildren && isExpanded && !menuRecolhido && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [pathname, userRole, menuRecolhido, expandedItems, handleNavigation, toggleExpanded]);

  return (
    <nav className="px-3 py-4 space-y-2">
      {filteredItems.map(item => renderMenuItem(item))}
    </nav>
  );
});

MenuItems.displayName = 'MenuItems';
export default MenuItems;