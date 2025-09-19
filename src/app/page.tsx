'use client';

import React from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeNumber } from '@/components/SafeNumber';
import { Building2, Users, DollarSign, Activity } from 'lucide-react';

export default function DashboardPage() {
  const stats = {
    totalCompanies: 156,
    totalUsers: 1247,
    monthlyRevenue: 45680,
    systemUptime: 99.8,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total de Empresas"
          value={<SafeNumber value={stats.totalCompanies} />}
          icon={<Building2 className="w-4 h-4" />}
          description="142 ativas, 14 inativas"
          descriptionColorClass="text-gray-600"
        />
        
        <DashboardCard
          title="Usuários Ativos"
          value={<SafeNumber value={stats.totalUsers} />}
          icon={<Users className="w-4 h-4" />}
          description="+12% este mês"
          descriptionColorClass="text-green-600"
        />
        
        <DashboardCard
          title="Receita Mensal"
          value={<SafeNumber value={stats.monthlyRevenue} format="currency" />}
          icon={<DollarSign className="w-4 h-4" />}
          description="+8% vs mês anterior"
          descriptionColorClass="text-green-600"
        />
        
        <DashboardCard
          title="Uptime do Sistema"
          value={`${stats.systemUptime}%`}
          icon={<Activity className="w-4 h-4" />}
          description="Estável"
          descriptionColorClass="text-green-600"
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
