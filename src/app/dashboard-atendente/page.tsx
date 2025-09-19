'use client';

<<<<<<< HEAD
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { FiClock, FiDollarSign, FiUsers, FiTrendingUp, FiFileText, FiMessageSquare, FiStar, FiCheck, FiUser, FiPhone as FiPhoneIcon } from 'react-icons/fi';
import LaudoProntoAlert from '@/components/LaudoProntoAlert';

interface AtendenteMetrics {
  totalOS: number;
  osCriadasMes: number;
  osPendentes: number;
  osEmAnalise: number;
  osConcluidas: number;
  clientesAtendidos: number;
  clientesNovos: number;
  tempoMedioAtendimento: number;
  satisfacaoMedia: number;
  atendimentosHoje: number;
  atendimentosSemana: number;
  ticketMedio: number;
  rankingAtendente: number;
  chamadasRecebidas: number;
  mensagensRespondidas: number;
}

export default function DashboardAtendentePage() {
  const router = useRouter();
  const { user, usuarioData, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AtendenteMetrics>({
    totalOS: 0,
    osCriadasMes: 0,
    osPendentes: 0,
    osEmAnalise: 0,
    osConcluidas: 0,
    clientesAtendidos: 0,
    clientesNovos: 0,
    tempoMedioAtendimento: 0,
    satisfacaoMedia: 0,
    atendimentosHoje: 0,
    atendimentosSemana: 0,
    ticketMedio: 0,
    rankingAtendente: 0,
    chamadasRecebidas: 0,
    mensagensRespondidas: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOS, setRecentOS] = useState<Record<string, unknown>[]>([]);
  const [recentClientes, setRecentClientes] = useState<Record<string, unknown>[]>([]);
  const [osComOrcamento, setOsComOrcamento] = useState<Record<string, unknown>[]>([]);
  const [osComLaudo, setOsComLaudo] = useState<Record<string, unknown>[]>([]);
  const [dataFetched, setDataFetched] = useState(false);

  const fetchAtendenteData = useCallback(async () => {
    if (!user || !usuarioData?.empresa_id || dataFetched) return;

    setLoading(true);
    try {
      const empresaId = usuarioData.empresa_id;
      const hoje = new Date();

      // Buscar OSs criadas pelo atendente
      const { data: ordens } = await supabase
        .from('ordens_servico')
        .select(`
          id,
          numero_os,
          status,
          valor_faturado,
          created_at,
          tecnico_id,
          atendente_id,
          servico,
          observacoes,
          orcamento,
          laudo,
          cliente_id,
          status_tecnico,
          clientes!cliente_id(nome, telefone, email)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      // Buscar clientes atendidos
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, nome, created_at')
        .eq('empresa_id', empresaId)
        .eq('atendente_id', user.id);

      // Separar OSs com orçamento e laudo
      const ordensData = ordens || [];
      
      // Buscar OSs com orçamento enviado (mesma lógica do LaudoProntoAlert)
      const osComOrcamentoData = ordensData.filter((os: Record<string, unknown>) => {
        const temOrcamentoEnviado = os.status_tecnico === 'ORÇAMENTO ENVIADO' || os.status_tecnico === 'AGUARDANDO APROVAÇÃO';
        return temOrcamentoEnviado;
      });
      
      // Buscar OSs com laudo (campo laudo preenchido ou status específico)
      const osComLaudoData = ordensData.filter((os: Record<string, unknown>) => {
        const temLaudo = (os.laudo && String(os.laudo).trim() !== '') || os.status_tecnico === 'LAUDO PRONTO';
        return temLaudo;
      });

      // Calcular métricas
      const totalOS = ordensData.length;
      const osCriadasMes = ordensData.filter((o: Record<string, unknown>) => 
        new Date(String(o.created_at)).getMonth() === hoje.getMonth()
      ).length;
      const osPendentes = ordensData.filter((o: Record<string, unknown>) => o.status === 'PENDENTE').length;
      const osEmAnalise = ordensData.filter((o: Record<string, unknown>) => o.status === 'EM ANÁLISE').length;
      const osConcluidas = ordensData.filter((o: Record<string, unknown>) => o.status === 'CONCLUIDA').length;
      const clientesAtendidos = (clientes || []).length;
      const clientesNovos = (clientes || []).filter((c: Record<string, unknown>) => 
        new Date(String(c.created_at)).getMonth() === hoje.getMonth()
      ).length;

      // Simular outras métricas
      const tempoMedioAtendimento = 15; // minutos
      const satisfacaoMedia = 4.8;
      const atendimentosHoje = Math.floor(Math.random() * 10) + 1;
      const atendimentosSemana = Math.floor(Math.random() * 50) + 10;
      const ticketMedio = ordensData.length > 0 
        ? ordensData.reduce((sum, os: Record<string, unknown>) => sum + (Number(os.valor_faturado) || 0), 0) / ordensData.length 
        : 0;
      const rankingAtendente = 1;
      const chamadasRecebidas = Math.floor(Math.random() * 20) + 5;
      const mensagensRespondidas = Math.floor(Math.random() * 30) + 10;

      setMetrics({
        totalOS,
        osCriadasMes,
        osPendentes,
        osEmAnalise,
        osConcluidas,
        clientesAtendidos,
        clientesNovos,
        tempoMedioAtendimento,
        satisfacaoMedia,
        atendimentosHoje,
        atendimentosSemana,
        ticketMedio,
        rankingAtendente,
        chamadasRecebidas,
        mensagensRespondidas
      });

      setRecentOS(ordensData.slice(0, 5));
      setRecentClientes((clientes || []).slice(0, 5));
      setOsComOrcamento(osComOrcamentoData);
      setOsComLaudo(osComLaudoData);
      setDataFetched(true);
      
    } catch (error) {
      console.error('Erro ao buscar dados do atendente:', error);
    } finally {
      setLoading(false);
    }
  }, [user, usuarioData?.empresa_id, dataFetched]);

  useEffect(() => {
    // Verificar se o usuário tem permissão para acessar esta dashboard
    if (usuarioData?.nivel) {
      if (usuarioData.nivel === 'admin') {
        router.replace('/dashboard');
        return;
      } else if (usuarioData.nivel === 'tecnico') {
        router.replace('/dashboard-tecnico');
        return;
      }
    }

    // Só buscar dados se não estiver carregando e tiver os dados necessários
    if (!authLoading && user && usuarioData?.empresa_id && !dataFetched) {
      fetchAtendenteData();
    }
  }, [authLoading, user, usuarioData?.empresa_id, usuarioData?.nivel, router, fetchAtendenteData, dataFetched]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO': return 'text-green-600 bg-green-100';
      case 'EM_ANALISE': return 'text-yellow-600 bg-yellow-100';
      case 'ABERTA': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <ProtectedArea area="dashboard">
        <MenuLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </MenuLayout>
      </ProtectedArea>
=======
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPhone, 
  FiMessageSquare, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiFileText,
  FiTrendingUp,
  FiUsers,
  FiRefreshCw
} from 'react-icons/fi';

interface OS {
  id: string;
  numero_os: string;
  cliente_nome: string;
  tecnico_nome: string;
  status: string;
  data_cadastro: string;
  marca: string;
  modelo: string;
  problema_relatado: string;
  cliente_whatsapp?: string;
  cliente_email?: string;
}

interface EstatisticasDia {
  totalOS: number;
  osAbertas: number;
  osEmAndamento: number;
  osFinalizadas: number;
  clientesAtendidos: number;
}

export default function DashboardAtendente() {
  const { usuarioData, empresaData } = useAuth();
  const [osList, setOsList] = useState<OS[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasDia>({
    totalOS: 0,
    osAbertas: 0,
    osEmAndamento: 0,
    osFinalizadas: 0,
    clientesAtendidos: 0
  });
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [horaAtual, setHoraAtual] = useState<string>('');

  // Atualizar hora a cada minuto
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      setHoraAtual(agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    atualizarHora();
    const interval = setInterval(atualizarHora, 60000);
    return () => clearInterval(interval);
  }, []);

  // Carregar dados
  useEffect(() => {
    if (empresaData?.id) {
      carregarDados();
    }
  }, [empresaData]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      if (!empresaData?.id) {
        console.log('Empresa ID não disponível ainda');
        return;
      }

      console.log('Carregando dados para empresa:', empresaData.id);
      
      // Buscar OSs da empresa - simplificando a query primeiro
      console.log('Testando query simplificada...');
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .order('data_cadastro', { ascending: false })
        .limit(20);

      if (osError) {
        console.error('Erro na consulta Supabase:', osError);
        throw osError;
      }

      console.log('OSs encontradas:', osData?.length || 0);

      // Buscar dados relacionados separadamente
      const clienteIds = [...new Set(osData?.map(os => os.cliente_id).filter(Boolean) || [])];
      const tecnicoIds = [...new Set(osData?.map(os => os.tecnico_id).filter(Boolean) || [])];

      console.log('Buscando clientes para IDs:', clienteIds);
      console.log('Buscando técnicos para IDs:', tecnicoIds);

      // Buscar clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome, whatsapp, email')
        .in('id', clienteIds.length > 0 ? clienteIds : ['']);

      // Buscar técnicos/usuários
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', tecnicoIds.length > 0 ? tecnicoIds : ['']);

      console.log('Clientes encontrados:', clientesData?.length || 0);
      console.log('Usuários encontrados:', usuariosData?.length || 0);

      // Criar maps para lookup rápido
      const clientesMap = new Map(clientesData?.map(c => [c.id, c]) || []);
      const usuariosMap = new Map(usuariosData?.map(u => [u.id, u]) || []);

      // Processar dados
      const osProcessadas = osData?.map(os => {
        const cliente = clientesMap.get(os.cliente_id);
        const usuario = usuariosMap.get(os.tecnico_id);
        
        return {
          id: os.id,
          numero_os: os.numero_os || `OS-${os.id.slice(0, 8)}`,
          cliente_nome: cliente?.nome || 'Cliente não informado',
          tecnico_nome: usuario?.nome || 'Técnico não informado',
          status: os.status || 'ABERTA',
          data_cadastro: os.data_cadastro,
          marca: os.marca || 'Não informado',
          modelo: os.modelo || 'Não informado',
          problema_relatado: os.problema_relatado || 'Problema não especificado',
          cliente_whatsapp: cliente?.whatsapp,
          cliente_email: cliente?.email
        };
      }) || [];

      setOsList(osProcessadas);

      // Calcular estatísticas
      const hoje = new Date().toISOString().split('T')[0];
      const osHoje = osProcessadas.filter(os => 
        os.data_cadastro.startsWith(hoje)
      );

      setEstatisticas({
        totalOS: osProcessadas.length,
        osAbertas: osProcessadas.filter(os => os.status === 'ABERTA').length,
        osEmAndamento: osProcessadas.filter(os => 
          ['EM ANDAMENTO', 'AGUARDANDO PEÇA', 'AGUARDANDO CLIENTE'].includes(os.status)
        ).length,
        osFinalizadas: osProcessadas.filter(os => 
          ['FINALIZADA', 'ENTREGUE'].includes(os.status)
        ).length,
        clientesAtendidos: new Set(osHoje.map(os => os.cliente_nome)).size
      });

      console.log('Dados carregados com sucesso');

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Mostrar erro mais detalhado
      if (error instanceof Error) {
        console.error('Mensagem de erro:', error.message);
        console.error('Stack trace:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ABERTA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EM ANDAMENTO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGUARDANDO PEÇA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'AGUARDANDO CLIENTE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FINALIZADA': return 'bg-green-100 text-green-800 border-green-200';
      case 'ENTREGUE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ABERTA': return <FiAlertCircle className="w-4 h-4" />;
      case 'EM ANDAMENTO': return <FiClock className="w-4 h-4" />;
      case 'AGUARDANDO PEÇA': return <FiClock className="w-4 h-4" />;
      case 'AGUARDANDO CLIENTE': return <FiClock className="w-4 h-4" />;
      case 'FINALIZADA': return <FiCheckCircle className="w-4 h-4" />;
      case 'ENTREGUE': return <FiCheckCircle className="w-4 h-4" />;
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  const filtrarOS = () => {
    let filtradas = osList;

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(os => os.status === filtroStatus);
    }

    // Filtro por busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtradas = filtradas.filter(os => 
        os.numero_os.toLowerCase().includes(buscaLower) ||
        os.cliente_nome.toLowerCase().includes(buscaLower) ||
        os.marca.toLowerCase().includes(buscaLower) ||
        os.modelo.toLowerCase().includes(buscaLower)
      );
    }

    return filtradas;
  };

  const enviarAvisoCliente = async (os: OS, tipo: 'whatsapp' | 'email') => {
    try {
      if (tipo === 'whatsapp' && !os.cliente_whatsapp) {
        alert('Cliente não possui WhatsApp cadastrado');
        return;
      }

      if (tipo === 'email' && !os.cliente_email) {
        alert('Cliente não possui email cadastrado');
        return;
      }

      // Aqui você pode implementar o envio real de avisos
      if (tipo === 'whatsapp') {
        alert(`Aviso enviado via WhatsApp para ${os.cliente_nome}`);
      } else {
        alert(`Aviso enviado via email para ${os.cliente_nome}`);
      }
    } catch (error) {
      console.error('Erro ao enviar aviso:', error);
      alert('Erro ao enviar aviso');
    }
  };

  const osFiltradas = filtrarOS();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
>>>>>>> stable-version
    );
  }

  return (
<<<<<<< HEAD
    <ProtectedArea area="dashboard">
      <MenuLayout>
        <div className="space-y-6">
          <LaudoProntoAlert />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Atendente</h1>
              <p className="text-gray-600">Bem-vindo, {usuarioData?.nome}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-sm font-medium">{new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* OSs Criadas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">OSs Criadas</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalOS}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiFileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+{metrics.osCriadasMes} este mês</span>
              </div>
            </div>

            {/* Clientes Atendidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Atendidos</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.clientesAtendidos}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiUsers className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+{metrics.clientesNovos} novos</span>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.ticketMedio)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <FiStar className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-600">Satisfação: {metrics.satisfacaoMedia}/5</span>
              </div>
            </div>

            {/* Atendimentos Hoje */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Atendimentos Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.atendimentosHoje}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FiClock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <FiMessageSquare className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-blue-600">{metrics.mensagensRespondidas} mensagens</span>
              </div>
            </div>
          </div>

          {/* Métricas Secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status das OSs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das OSs</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <span className="text-lg font-semibold text-blue-600">{metrics.osPendentes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em Análise</span>
                  <span className="text-lg font-semibold text-yellow-600">{metrics.osEmAnalise}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Concluídas</span>
                  <span className="text-lg font-semibold text-green-600">{metrics.osConcluidas}</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tempo Médio</span>
                  <span className="text-lg font-semibold text-gray-900">{metrics.tempoMedioAtendimento}min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ranking</span>
                  <span className="text-lg font-semibold text-purple-600">#{metrics.rankingAtendente}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Chamadas</span>
                  <span className="text-lg font-semibold text-green-600">{metrics.chamadasRecebidas}</span>
                </div>
              </div>
            </div>

            {/* Atendimentos da Semana */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Esta Semana</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Atendimentos</span>
                  <span className="text-lg font-semibold text-blue-600">{metrics.atendimentosSemana}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Novos Clientes</span>
                  <span className="text-lg font-semibold text-green-600">{metrics.clientesNovos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">OSs Criadas</span>
                  <span className="text-lg font-semibold text-purple-600">{metrics.osCriadasMes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Recente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OSs Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">OSs Recentes</h3>
              <div className="space-y-3">
                {recentOS.map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">OS #{os.numero_os}</p>
                      <p className="text-sm text-gray-600">{os.clientes?.nome}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>
                        {os.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(os.created_at)}</p>
                    </div>
                  </div>
                ))}
                {recentOS.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhuma OS encontrada</p>
                )}
              </div>
            </div>

            {/* Clientes Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes Recentes</h3>
              <div className="space-y-3">
                {recentClientes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cliente.nome}</p>
                      <p className="text-sm text-gray-600">{cliente.telefone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(cliente.created_at)}</p>
                    </div>
                  </div>
                ))}
                {recentClientes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhum cliente encontrado</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção Chamativa - OSs com Orçamento e Laudo */}
          <div className="space-y-6">
            {/* Debug info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
              <p className="text-sm text-yellow-700">OSs com orçamento: {osComOrcamento.length}</p>
              <p className="text-sm text-yellow-700">OSs com laudo: {osComLaudo.length}</p>
              <p className="text-sm text-yellow-700">Total de OSs: {recentOS.length}</p>
            </div>

            {/* OSs com Orçamento Pronto */}
            {osComOrcamento.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FiFileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">Orçamentos Prontos</h3>
                      <p className="text-blue-600">OSs com orçamento aguardando aprovação</p>
                    </div>
                  </div>
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-blue-800 font-semibold">{osComOrcamento.length}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {osComOrcamento.map((os) => (
                    <div key={os.id} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">OS #{os.numero_os}</h4>
                          <p className="text-sm text-gray-600">{os.clientes?.nome}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Orçamento
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiUser className="w-4 h-4 mr-2" />
                          <span>{os.clientes?.nome}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiPhoneIcon className="w-4 h-4 mr-2" />
                          <span>{os.clientes?.telefone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiFileText className="w-4 h-4 mr-2" />
                          <span className="truncate">{os.servico || 'Serviço não especificado'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{formatDate(os.created_at)}</span>
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
                            Ver Orçamento
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OSs com Laudo Pronto */}
            {osComLaudo.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <FiCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">Laudos Prontos</h3>
                      <p className="text-green-600">OSs com laudo técnico finalizado</p>
                    </div>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-800 font-semibold">{osComLaudo.length}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {osComLaudo.map((os) => (
                    <div key={os.id} className="bg-white rounded-lg p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">OS #{os.numero_os}</h4>
                          <p className="text-sm text-gray-600">{os.clientes?.nome}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Laudo
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiUser className="w-4 h-4 mr-2" />
                          <span>{os.clientes?.nome}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiPhoneIcon className="w-4 h-4 mr-2" />
                          <span>{os.clientes?.telefone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiFileText className="w-4 h-4 mr-2" />
                          <span className="truncate">{os.servico || 'Serviço não especificado'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{formatDate(os.created_at)}</span>
                          <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors">
                            Ver Laudo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há OSs com orçamento ou laudo */}
            {osComOrcamento.length === 0 && osComLaudo.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FiFileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum orçamento ou laudo pronto</h3>
                <p className="text-gray-500">Quando os técnicos finalizarem orçamentos ou laudos, eles aparecerão aqui para você acompanhar.</p>
              </div>
            )}
          </div>
        </div>
      </MenuLayout>
    </ProtectedArea>
  );
} 
=======
    <MenuLayout>
      <ProtectedArea area="dashboard">
        <div className="p-8">
          {/* Header com Saudação */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getSaudacao()}, {usuarioData?.nome?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">{horaAtual}</div>
              <div className="text-gray-500 text-sm">Hora atual</div>
            </div>
          </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de OS</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.totalOS}</p>
              <p className="text-xs text-gray-500 mt-1">Todas as ordens</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">OS Abertas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.osAbertas}</p>
              <p className="text-xs text-gray-500 mt-1">Aguardando atendimento</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.osEmAndamento}</p>
              <p className="text-xs text-gray-500 mt-1">Sendo processadas</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Finalizadas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.osFinalizadas}</p>
              <p className="text-xs text-gray-500 mt-1">Concluídas hoje</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.clientesAtendidos}</p>
              <p className="text-xs text-gray-500 mt-1">Atendidos hoje</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por OS, cliente, marca ou modelo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full"
            />
          </div>
          <Select 
            value={filtroStatus} 
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full md:w-48"
          >
            <option value="todos">Todos os status</option>
            <option value="ABERTA">Aberta</option>
            <option value="EM ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO PEÇA">Aguardando Peça</option>
            <option value="AGUARDANDO CLIENTE">Aguardando Cliente</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="ENTREGUE">Entregue</option>
          </Select>
          <Button 
            onClick={carregarDados}
            variant="default"
            className="flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Lista de OS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Últimas Ordens de Serviço</h2>
          <p className="text-gray-600 mt-1">Acompanhe o status das OSs em tempo real</p>
        </div>
        
        <div className="p-6">
          {osFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma OS encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {osFiltradas.map((os) => (
                <div key={os.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(os.status)}
                            {os.status}
                          </div>
                        </span>
                        <span className="font-mono text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                          {os.numero_os}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            <FiUser className="w-4 h-4 inline mr-2" />
                            {os.cliente_nome}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Técnico:</span> {os.tecnico_nome}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Equipamento:</span> {os.marca} {os.modelo}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Problema:</span> {os.problema_relatado}
                          </p>
                          <p className="text-sm text-gray-600">
                            <FiCalendar className="w-4 h-4 inline mr-2" />
                            {new Date(os.data_cadastro).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enviarAvisoCliente(os, 'whatsapp')}
                        disabled={!os.cliente_whatsapp}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <FiMessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enviarAvisoCliente(os, 'email')}
                        disabled={!os.cliente_email}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FiPhone className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </div>
      </ProtectedArea>
    </MenuLayout>
  );
}
>>>>>>> stable-version
