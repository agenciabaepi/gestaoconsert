'use client';

import React from 'react';
import Link from 'next/link';
import {
  CogIcon,
  UserIcon,
  BuildingOfficeIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ConfiguracoesMenuSectionProps {
  userRole: string;
  empresaId: string;
}

const ConfiguracoesMenuSection: React.FC<ConfiguracoesMenuSectionProps> = ({ 
  userRole, 
  empresaId 
}) => {
  const menuItems = [
    {
      title: 'Perfil',
      href: '/perfil',
      icon: <UserIcon className="h-4 w-4" />,
      description: 'Configurações do perfil pessoal',
      roles: ['admin', 'gerente', 'tecnico', 'vendedor']
    },
    {
      title: 'Empresa',
      href: '/configuracoes/empresa',
      icon: <BuildingOfficeIcon className="h-4 w-4" />,
      description: 'Dados da empresa',
      roles: ['admin', 'gerente']
    },
    {
      title: 'Status de OS',
      href: '/configuracoes/status',
      icon: <CogIcon className="h-4 w-4" />,
      description: 'Configurar status das ordens',
      roles: ['admin', 'gerente']
    },
    {
      title: 'Usuários',
      href: '/configuracoes/usuarios',
      icon: <UserIcon className="h-4 w-4" />,
      description: 'Gerenciar usuários do sistema',
      roles: ['admin']
    },
    {
      title: 'Notificações',
      href: '/configuracoes/notificacoes',
      icon: <BellIcon className="h-4 w-4" />,
      description: 'Configurar notificações',
      roles: ['admin', 'gerente']
    },
    {
      title: 'Segurança',
      href: '/configuracoes/seguranca',
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      description: 'Configurações de segurança',
      roles: ['admin']
    },
    {
      title: 'Termos e Políticas',
      href: '/termos',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      description: 'Termos de uso e políticas',
      roles: ['admin', 'gerente', 'tecnico', 'vendedor']
    }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="space-y-1">
      {filteredItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
        >
          <div className="mr-3 flex-shrink-0 text-gray-400 group-hover:text-gray-500">
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{item.title}</div>
            <div className="text-xs text-gray-500">{item.description}</div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ConfiguracoesMenuSection;