'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  CreditCardIcon 
} from '@heroicons/react/24/outline';

interface FinanceiroMenuSectionProps {
  userRole: string;
  empresaId: string;
}

const FinanceiroMenuSection: React.FC<FinanceiroMenuSectionProps> = ({
  userRole,
  empresaId
}) => {
  const menuItems = [
    {
      href: '/financeiro',
      label: 'Visão Geral',
      icon: <ChartBarIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente', 'financeiro']
    },
    {
      href: '/pagamentos',
      label: 'Pagamentos',
      icon: <CreditCardIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente', 'financeiro']
    },
    {
      href: '/caixa',
      label: 'Caixa',
      icon: <CurrencyDollarIcon className="h-4 w-4" />,
      roles: ['admin', 'gerente', 'caixa']
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

export default React.memo(FinanceiroMenuSection);