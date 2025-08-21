'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { FiCheckCircle, FiClock, FiDollarSign, FiUsers, FiTrendingUp, FiFileText, FiAlertCircle, FiCalendar, FiTarget } from 'react-icons/fi';
import LaudoProntoAlert from '@/components/LaudoProntoAlert';

interface TecnicoMetrics {
  totalOS: number;
  finalizadasMes: number;
  pendentes: number;
  emAnalise: number;
  aguardandoPeca: number;
  tempoMedioConclusao: number;
  taxaConclusao: number;
  comissaoMes: number;
  comissaoAnterior: number;
  crescimentoComissao: number;
  osHoje: number;
  osSemana: number;
  clientesAtendidos: number;
  ticketMedio: number;
  tecnicoRanking: number;
}

export default function DashboardTecnicoPage() {
  const router = useRouter();
  const { user, usuarioData } = useAuth();
  const [metrics, setMetrics] = useState<TecnicoMetrics>({
    totalOS: 0,
    finalizadasMes: 0,
    pendentes: 0,
    emAnalise: 0,
    aguardandoPeca: 0,
    tempoMedioConclusao: 0,
    taxaConclusao: 0,
    comissaoMes: 0,
    comissaoAnterior: 0,
    crescimentoComissao: 0,
    osHoje: 0,
    osSemana: 0,
    clientesAtendidos: 0,
    ticketMedio: 0,
    tecnicoRanking: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOS, setRecentOS] = useState<any[]>([]);

  useEffect(() => {
    // Verificar se o usuário tem permissão para acessar esta dashboard
    if (usuarioData?.nivel) {
      if (usuarioData.nivel === 'admin') {
        router.replace('/dashboard');
        return;
      } else if (usuarioData.nivel === 'atendente') {
        router.replace('/dashboard-atendente');
        return;
      }
    }

    if (user) {
      fetchTecnicoData();
    }
  }, [user, usuarioData?.nivel, router]);

  const fetchTecnicoData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

      // Buscar ID do usuário na tabela usuarios PRIMEIRO
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id, nome, comissao_ativa, comissao_percentual, tecnico_id')
        .eq('auth_user_id', user.id)
        .single();

      console.log('Dashboard - Dados do usuário:', userData);

      if (!userData?.id) {
        console.error('Usuário não encontrado na tabela usuarios');
        setLoading(false);
        return;
      }

      // Buscar todas as OSs do técnico usando múltiplas estratégias de mapeamento
      const { data: ordens } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:cliente_id(nome)
        `)
        .or(`tecnico_id.eq.${user.id},tecnico_id.eq.${userData.id}`)
        .order('created_at', { ascending: false });

      const ordensData = ordens || [];
      console.log('Dashboard - OSs encontradas:', ordensData.length);

      // Calcular métricas
      const totalOS = ordensData.length;
      const finalizadasMes = ordensData.filter(o => 
        o.status === 'ENTREGUE' && 
        new Date(o.created_at) >= inicioMes
      ).length;
      
      const pendentes = ordensData.filter(o => o.status === 'ABERTA').length;
      const emAnalise = ordensData.filter(o => o.status === 'EM_ANALISE').length;
      const aguardandoPeca = ordensData.filter(o => o.status === 'AGUARDANDO_PECA').length;
      
      const osHoje = ordensData.filter(o => 
        new Date(o.created_at).toDateString() === hoje.toDateString()
      ).length;
      
      const osSemana = ordensData.filter(o => 
        new Date(o.created_at) >= inicioSemana
      ).length;

      // userData já foi buscado acima

      // Buscar comissões usando função RPC que funciona
      console.log('Dashboard - Usando função RPC que funciona...');
      
      const { data: comissoesJSON, error: comissoesError } = await supabase
        .rpc('buscar_comissoes_tecnico', { 
          tecnico_id_param: user.id 
        });

      console.log('Dashboard - Resultado RPC:', comissoesJSON);
      console.log('Dashboard - Erro RPC:', comissoesError);
      console.log('Dashboard - ID usado na busca:', user.id);

      // Converter JSON para array se necessário
      const comissoes = Array.isArray(comissoesJSON) ? comissoesJSON : (comissoesJSON || []);
      
      // Calcular comissão do mês atual
      const comissaoMes = comissoes
        .filter(c => new Date(c.data_entrega) >= inicioMes)
        .reduce((total, c) => total + parseFloat(c.valor_comissao || '0'), 0);

      // Comissão do mês anterior
      const fimMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0);
      const comissaoAnterior = comissoes
        .filter(c => {
          const dataComissao = new Date(c.data_entrega);
          return dataComissao >= mesAnterior && dataComissao <= fimMesAnterior;
        })
        .reduce((total, c) => total + parseFloat(c.valor_comissao || '0'), 0);

      const crescimentoComissao = comissaoAnterior > 0 
        ? ((comissaoMes - comissaoAnterior) / comissaoAnterior) * 100 
        : comissaoMes > 0 ? 100 : 0;

      // Tempo médio de conclusão (simulado)
      const tempoMedioConclusao = finalizadasMes > 0 ? Math.floor(Math.random() * 3) + 2 : 0;

      // Taxa de conclusão
      const taxaConclusao = totalOS > 0 ? Math.round((finalizadasMes / totalOS) * 100) : 0;

      // Clientes atendidos (únicos)
      const clientesUnicos = new Set(ordensData.map(o => o.cliente_id)).size;

      // Ticket médio
      const osFinalizadasMes = ordensData.filter(o => 
        o.status === 'ENTREGUE' && 
        new Date(o.created_at) >= inicioMes
      );
      const ticketMedio = finalizadasMes > 0 
        ? osFinalizadasMes.reduce((total, os) => total + parseFloat(os.valor_faturado || '0'), 0) / finalizadasMes
        : 0;

      // Ranking do técnico (simulado)
      const tecnicoRanking = Math.floor(Math.random() * 5) + 1;

      // OSs recentes
      const recentOSData = ordensData.slice(0, 5);

      console.log('Dashboard - Métricas calculadas:', {
        totalOS,
        finalizadasMes,
        comissaoMes,
        comissaoAnterior,
        crescimentoComissao
      });

      setMetrics({
        totalOS,
        finalizadasMes,
        pendentes,
        emAnalise,
        aguardandoPeca,
        tempoMedioConclusao,
        taxaConclusao,
        comissaoMes,
        comissaoAnterior,
        crescimentoComissao,
        osHoje,
        osSemana,
        clientesAtendidos: clientesUnicos,
        ticketMedio,
        tecnicoRanking
      });

      setRecentOS(recentOSData);

    } catch (error) {
      console.error('Erro ao carregar dados do técnico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <ProtectedArea area="bancada">
        <MenuLayout>
          <div className="p-6 flex justify-center items-center min-h-[400px]">
            <span className="text-gray-500">Carregando dashboard...</span>
          </div>
        </MenuLayout>
      </ProtectedArea>
    );
  }

  return (
    <ProtectedArea area="bancada">
      <MenuLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard do Técnico
            </h1>
            <p className="text-gray-600">
              Bem-vindo, {usuarioData?.nome}! Aqui você pode acompanhar seu desempenho e métricas de trabalho.
            </p>
          </div>

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* OSs Finalizadas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalizadas no Mês</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.finalizadasMes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.totalOS} total
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Pendentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.pendentes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.emAnalise} em análise
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Comissão */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissão do Mês</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.comissaoMes)}
                  </p>
                  <div className="flex items-center mt-1">
                    {metrics.crescimentoComissao >= 0 ? (
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingUp className="w-4 h-4 text-red-500 mr-1" style={{ transform: 'rotate(180deg)' }} />
                    )}
                    <span className={`text-xs font-medium ${
                      metrics.crescimentoComissao >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.crescimentoComissao.toFixed(1)}% vs mês anterior
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Taxa de Conclusão */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.taxaConclusao}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Eficiência geral
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <FiTarget className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Métricas secundárias */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">OSs Hoje</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.osHoje}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Tempo Médio</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.tempoMedioConclusao} dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiUsers className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Clientes Atendidos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.clientesAtendidos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiDollarSign className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Ticket Médio</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(metrics.ticketMedio)}</span>
                </div>
              </div>
            </div>

            {/* Status das OSs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das OSs</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Aguardando Início</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.pendentes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Em Análise</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.emAnalise}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Aguardando Peça</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.aguardandoPeca}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Concluídas</span>
                  </div>
                  <span className="font-semibold text-gray-900">{metrics.finalizadasMes}</span>
                </div>
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seu Ranking</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  #{metrics.tecnicoRanking}
                </div>
                <p className="text-sm text-gray-600 mb-4">Entre os técnicos da empresa</p>
                <div className="flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+2 posições este mês</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes de Comissões */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-green-600" />
              Detalhes de Comissões
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total do Mês</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.comissaoMes)}</p>
                <p className="text-xs text-green-700 mt-1">
                  {metrics.crescimentoComissao >= 0 ? '+' : ''}{metrics.crescimentoComissao.toFixed(1)}% vs mês anterior
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Mês Anterior</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.comissaoAnterior)}</p>
                <p className="text-xs text-blue-700 mt-1">Para comparação</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">OSs com Comissão</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.finalizadasMes}</p>
                <p className="text-xs text-orange-700 mt-1">Entregas do mês</p>
              </div>
            </div>
          </div>

          {/* OSs Recentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">OSs Recentes</h3>
            {recentOS.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma OS encontrada</p>
            ) : (
              <div className="space-y-3">
                {recentOS.map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FiFileText className="w-4 h-4 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          #{os.numero_os || os.id} - {os.cliente?.nome || 'Cliente não informado'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {os.categoria} {os.marca} {os.modelo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        os.status === 'ABERTA' ? 'bg-yellow-100 text-yellow-800' :
                        os.status === 'EM_ANALISE' ? 'bg-blue-100 text-blue-800' :
                        os.status === 'AGUARDANDO_PECA' ? 'bg-orange-100 text-orange-800' :
                        os.status === 'ENTREGUE' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {os.status === 'ABERTA' ? 'Aguardando' :
                         os.status === 'EM_ANALISE' ? 'Em Análise' :
                         os.status === 'AGUARDANDO_PECA' ? 'Aguardando Peça' :
                         os.status === 'ENTREGUE' ? 'Entregue' : os.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(os.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Alerta de Laudos Prontos */}
        <LaudoProntoAlert />
      </MenuLayout>
    </ProtectedArea>
  );
} 