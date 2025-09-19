'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import TrialLimitsAlert from '@/components/TrialLimitsAlert';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiFileText, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import LaudoProntoAlert from '@/components/LaudoProntoAlert';
import { useRealtimeNotificacoes } from '@/hooks/useRealtimeNotificacoes';
import NotificacoesFixas from '@/components/NotificacoesFixas';
import { forceLogout } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';


interface DashboardMetrics {
  totalOrdens: number;
  ordensHoje: number;
  ordensSemana: number;
  totalClientes: number;
  clientesNovos: number;
  faturamentoMes: number;
  faturamentoAnterior: number;
  crescimentoFaturamento: number;
  ordensPendentes: number;
  ordensConcluidas: number;
  ticketMedio: number;
  tecnicoMaisAtivo: string;
  servicoMaisPopular: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { usuarioData, empresaData } = useAuth();
  const { notificacoesFixas, marcarClienteAvisado } = useRealtimeNotificacoes(empresaData?.id);
  const router = useRouter();
  
  
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrdens: 0,
    ordensHoje: 0,
    ordensSemana: 0,
    totalClientes: 0,
    clientesNovos: 0,
    faturamentoMes: 0,
    faturamentoAnterior: 0,
    crescimentoFaturamento: 0,
    ordensPendentes: 0,
    ordensConcluidas: 0,
    ticketMedio: 0,
    tecnicoMaisAtivo: '',
    servicoMaisPopular: ''
  });
  const [loading, setLoading] = useState(true);
  const [recentOrdens, setRecentOrdens] = useState<any[]>([]);

  // Redirecionamento automático baseado no nível do usuário
  useEffect(() => {
    if (usuarioData?.nivel && usuarioData.nivel !== 'admin') {
      if (usuarioData.nivel === 'atendente') {
        router.replace('/dashboard-atendente');
      } else if (usuarioData.nivel === 'tecnico') {
        router.replace('/dashboard-tecnico');
      }
      return;
    }
  }, [usuarioData?.nivel, router]);

  useEffect(() => {
    // Verificar se o usuário tem permissão para acessar esta dashboard
    if (usuarioData?.nivel) {
      if (usuarioData.nivel === 'tecnico') {
        router.replace('/dashboard-tecnico');
        return;
      } else if (usuarioData.nivel === 'atendente') {
        router.replace('/dashboard-atendente');
        return;
      }
    }

    if (usuarioData?.empresa_id) {
      fetchDashboardData();
    }
  }, [usuarioData?.empresa_id, usuarioData?.nivel, router]);

  const fetchDashboardData = async () => {
    if (!usuarioData?.empresa_id) return;

    setLoading(true);
    try {
      const empresaId = usuarioData.empresa_id;
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

      // Buscar ordens de serviço
      const { data: ordens } = await supabase
        .from('ordens_servico')
        .select(`
          id,
          numero_os,
          status,
          valor_faturado,
          created_at,
          tecnico_id,
          servico,
          usuarios!tecnico_id(nome)
        `)
        .eq('empresa_id', empresaId);

      // Buscar clientes
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, created_at')
        .eq('empresa_id', empresaId);

      // Buscar vendas
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_total, data_venda')
        .eq('empresa_id', empresaId);

      // Calcular métricas
      const ordensData = ordens || [];
      const clientesData = clientes || [];
      const vendasData = vendas || [];

      const totalOrdens = ordensData.length;
      const ordensHoje = ordensData.filter(o => 
        new Date(o.created_at).toDateString() === hoje.toDateString()
      ).length;
      const ordensSemana = ordensData.filter(o => 
        new Date(o.created_at) >= inicioSemana
      ).length;
      const ordensPendentes = ordensData.filter(o => o.status === 'pendente').length;
      const ordensConcluidas = ordensData.filter(o => o.status === 'concluida').length;

      const totalClientes = clientesData.length;
      const clientesNovos = clientesData.filter(c => 
        new Date(c.created_at) >= inicioMes
      ).length;

      const faturamentoMes = vendasData
        .filter(v => new Date(v.data_venda) >= inicioMes)
        .reduce((sum, v) => sum + (v.valor_total || 0), 0);

      const faturamentoAnterior = vendasData
        .filter(v => {
          const dataVenda = new Date(v.data_venda);
          return dataVenda >= mesAnterior && dataVenda < inicioMes;
        })
        .reduce((sum, v) => sum + (v.valor_total || 0), 0);

      const crescimentoFaturamento = faturamentoAnterior > 0 
        ? ((faturamentoMes - faturamentoAnterior) / faturamentoAnterior) * 100 
        : 0;

      const ticketMedio = vendasData.length > 0 
        ? vendasData.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendasData.length 
        : 0;

      // Técnico mais ativo
      const tecnicos = ordensData.reduce((acc, ordem) => {
        const tecnico = ordem.usuarios?.nome || 'Sem técnico';
        acc[tecnico] = (acc[tecnico] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tecnicoMaisAtivo = Object.entries(tecnicos)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      // Serviço mais popular
      const servicos = ordensData.reduce((acc, ordem) => {
        const servico = ordem.servico || 'Sem serviço';
        acc[servico] = (acc[servico] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const servicoMaisPopular = Object.entries(servicos)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      // Ordens recentes
      const recentOrdensData = ordensData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setMetrics({
        totalOrdens,
        ordensHoje,
        ordensSemana,
        totalClientes,
        clientesNovos,
        faturamentoMes,
        faturamentoAnterior,
        crescimentoFaturamento,
        ordensPendentes,
        ordensConcluidas,
        ticketMedio,
        tecnicoMaisAtivo,
        servicoMaisPopular
      });

      setRecentOrdens(recentOrdensData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Se não é admin, mostrar loading durante redirecionamento
  if (usuarioData?.nivel && usuarioData.nivel !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando para seu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MenuLayout>
      <ProtectedArea area="dashboard">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo de volta, {usuarioData?.nome}! Aqui está o resumo do seu negócio.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Empresa</p>
              <p className="font-semibold text-gray-900">{empresaData?.nome}</p>
            </div>
          </div>
          
          {/* Alertas de limites do trial */}
          <TrialLimitsAlert />



          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ordens Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.ordensHoje}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.ordensSemana} esta semana
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <FiFileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Faturamento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.faturamentoMes)}
                  </p>
                  <div className="flex items-center mt-1">
                    {metrics.crescimentoFaturamento >= 0 ? (
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      metrics.crescimentoFaturamento >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.crescimentoFaturamento.toFixed(1)}% vs mês anterior
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalClientes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{metrics.clientesNovos} este mês
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <FiUsers className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.ticketMedio)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    por venda
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <FiTrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Métricas secundárias */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Ordens</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pendentes</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.ordensPendentes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Concluídas</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.ordensConcluidas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFileText className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.totalOrdens}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Destaques</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Técnico mais ativo</p>
                  <p className="font-semibold text-gray-900">{metrics.tecnicoMaisAtivo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Serviço mais popular</p>
                  <p className="font-semibold text-gray-900">{metrics.servicoMaisPopular}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mês atual</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(metrics.faturamentoMes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mês anterior</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(metrics.faturamentoAnterior)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Crescimento</span>
                  <span className={`font-semibold ${
                    metrics.crescimentoFaturamento >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.crescimentoFaturamento.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordens recentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordens Recentes</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando...</p>
              </div>
            ) : recentOrdens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">OS</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Serviço</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Técnico</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrdens.map((ordem) => (
                      <tr key={ordem.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          #{ordem.numero_os}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {ordem.servico || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {ordem.usuarios?.nome || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            ordem.status === 'concluida' 
                              ? 'bg-green-100 text-green-800'
                              : ordem.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ordem.status || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(ordem.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {formatCurrency(ordem.valor_faturado || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma ordem de serviço encontrada</p>
              </div>
            )}
          </div>
        </div>
        
                            {/* Alerta de Laudos Prontos */}
                    <LaudoProntoAlert />
                    
                    {/* Notificações Fixas */}
                    

                    
                    <NotificacoesFixas 
                      notificacoes={notificacoesFixas}
                      onMarcarAvisado={marcarClienteAvisado}
                    />
                    
                  </ProtectedArea>
                </MenuLayout>
  );
}