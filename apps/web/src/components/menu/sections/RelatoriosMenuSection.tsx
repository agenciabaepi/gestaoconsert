'use client';

import React from 'react';
import Link from 'next/link';
import { 
  DocumentChartBarIcon,
  DocumentTextIcon,
  ChartPieIcon 
} from '@heroicons/react/24/outline';

interface RelatoriosMenuSectionProps {
  userRole: string;
  empresaId: string;
}

const RelatoriosMenuSection: React.FC<RelatoriosMenuSectionProps> = ({
  userRole,
  empresaId
}) => {
  const menuItems = [
    {
      href: '/relatorios/vendas',
      label: 'Relatório de Vendas',
      icon: <ChartPieIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente']
    },
    {
      href: '/relatorios/servicos',
      label: 'Relatório de Serviços',
      icon: <DocumentChartBarIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente', 'tecnico']
    },
    {
      href: '/relatorios/financeiro',
      label: 'Relatório Financeiro',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente', 'financeiro']
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
          className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {item.icon}
          <span className="ml-2">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default React.memo(RelatoriosMenuSection);