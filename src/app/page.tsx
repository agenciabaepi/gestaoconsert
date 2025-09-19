'use client';

import React from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeNumber } from '@/components/SafeNumber';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  // Dados mockados para demonstração
  const stats = {
    totalCompanies: 156,
    activeCompanies: 142,
    inactiveCompanies: 14,
    totalUsers: 1247,
    monthlyRevenue: 45680,
    pendingPayments: 8,
    systemUptime: 99.8,
    newCompaniesThisMonth: 12,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Última atualização: {new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <DashboardCard
          title="Empresas Ativas"
          value={<SafeNumber value={stats.activeCompanies} />}
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
          colorClass="text-blue-700"
          bgClass="bg-blue-50"
          description="+20% desde o mês passado"
          descriptionColorClass="text-green-600"
        />
        <DashboardCard
          title="Receita Mensal"
          value={<SafeNumber value={stats.monthlyRevenue} format="currency" />}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          colorClass="text-green-700"
          bgClass="bg-green-50"
          description="+15% desde o mês passado"
          descriptionColorClass="text-green-600"
        />
        <DashboardCard
          title="Novos Usuários"
          value={<SafeNumber value={stats.newCompaniesThisMonth} />}
          icon={<Users className="h-5 w-5 text-purple-500" />}
          colorClass="text-purple-700"
          bgClass="bg-purple-50"
          description="+5% desde a semana passada"
          descriptionColorClass="text-green-600"
        />
        <DashboardCard
          title="Uptime do Sistema"
          value={`${stats.systemUptime}%`}
          icon={<Activity className="h-5 w-5 text-yellow-500" />}
          colorClass="text-yellow-700"
          bgClass="bg-yellow-50"
          description="Estável"
          descriptionColorClass="text-gray-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nenhuma atividade recente para mostrar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
