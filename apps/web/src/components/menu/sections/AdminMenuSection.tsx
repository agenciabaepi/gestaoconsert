'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  CircleStackIcon,
  KeyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AdminMenuSectionProps {
  userRole: string;
  empresaId: string;
}

const AdminMenuSection: React.FC<AdminMenuSectionProps> = ({ 
  userRole, 
  empresaId 
}) => {
  // Apenas admins podem ver esta seção
  if (userRole !== 'admin') {
    return null;
  }

  const menuItems = [
    {
      title: 'Painel Admin',
      href: '/admin',
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      description: 'Painel administrativo geral'
    },
    {
      title: 'Gerenciar Usuários',
      href: '/admin/usuarios',
      icon: <UserGroupIcon className="h-4 w-4" />,
      description: 'Adicionar e gerenciar usuários'
    },
    {
      title: 'Configurações Sistema',
      href: '/admin/sistema',
      icon: <CogIcon className="h-4 w-4" />,
      description: 'Configurações avançadas do sistema'
    },
    {
      title: 'Relatórios Admin',
      href: '/admin/relatorios',
      icon: <ChartBarIcon className="h-4 w-4" />,
      description: 'Relatórios administrativos'
    },
    {
      title: 'Backup & Dados',
      href: '/admin/backup',
      icon: <CircleStackIcon className="h-4 w-4" />,
      description: 'Gerenciar backups e dados'
    },
    {
      title: 'Logs do Sistema',
      href: '/admin/logs',
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      description: 'Visualizar logs e erros'
    },
    {
      title: 'Permissões',
      href: '/admin/permissoes',
      icon: <KeyIcon className="h-4 w-4" />,
      description: 'Gerenciar permissões de acesso'
    }
  ];

  return (
    <div className="space-y-1">
      {menuItems.map((item) => (
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

export default AdminMenuSection;