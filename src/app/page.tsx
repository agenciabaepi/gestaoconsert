'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeNumber } from '@/components/SafeNumber';
import { SafeDate } from '@/components/SafeDate';
import { useMetrics } from '@/hooks/useApi';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: metrics, loading, error, refetch } = useMetrics();

  // Dados de fallback caso a API não esteja disponível
  const fallbackStats = {
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    systemUptime: 0,
    newCompaniesThisMonth: 0,
  };

  const stats = metrics?.data || fallbackStats;

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Bem-vindo, {user?.email}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Última atualização: <SafeDate format="datetime" /></span>
          <button
            onClick={refetch}
            className="text-green-600 hover:text-green-700 transition-colors"
            title="Atualizar dados"
          >
            ↻
          </button>
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