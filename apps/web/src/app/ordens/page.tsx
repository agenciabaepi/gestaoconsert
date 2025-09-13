
'use client';

interface OrdemTransformada {
  id: string;
  numero: number;
  cliente: string;
  clienteTelefone: string;
  clienteEmail: string;
  aparelho: string;
  aparelhoCategoria: string;
  aparelhoMarca: string;
  servico: string;
  statusOS: string;
  statusTecnico: string;
  entrada: string;
  tecnico: string;
  atendente: string;
  entrega: string;
  prazoEntrega: string;
  garantia: string;
  valorPeca: number;
  valorServico: number;
  desconto: number;
  valorTotal: number;
  valorComDesconto: number;
  valorFaturado: number;
  tipo: string;
  foiFaturada: boolean;
  formaPagamento: string;
  osGarantiaId?: string | null;
  observacao?: string | null;
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiPlus, FiSearch, FiFilter, FiUser, FiSmartphone, FiDollarSign, FiClock, FiAlertCircle, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import DashboardCard from '@/components/ui/DashboardCard';
import MenuLayout from '@/components/MenuLayout';
import { useToast } from '@/components/Toast';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import LaudoProntoAlert from '@/components/LaudoProntoAlert';
import { useSupabaseRetry } from '@/hooks/useRetry';
import { OSFullPageSkeleton } from '@/components/OSTableSkeleton';
import { useOSPermissions } from '@/hooks/useOSPermissions';

export default function ListaOrdensPage() {
  const router = useRouter();
  const { validateCompanyData, getCompanyId, loading: authLoading } = useOSPermissions();
  const { usuarioData, empresaData } = useAuth();
  const { addToast } = useToast();
  const { executeWithRetry, manualRetry, state: retryState } = useSupabaseRetry();

  // Estados dos cards principais
  const [totalOS, setTotalOS] = useState(0);
  const [percentualRetornos, setPercentualRetornos] = useState(0);

  // Estados da lista
  const [ordens, setOrdens] = useState<OrdemTransformada[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Começar como false para evitar loops
  const [loadingOrdens, setLoadingOrdens] = useState(false);
  const [error, setError] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [cacheKey, setCacheKey] = useState('');
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aparelhoFilter, setAparelhoFilter] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  
  // ✅ CORREÇÃO: Adicionar estado para controlar hidratação
  const [isMounted, setIsMounted] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);

  // Estado para abas
  const [activeTab, setActiveTab] = useState('todas');
  
  // Definir todos os hooks antes de qualquer early return
  const handleRetry = useCallback(async () => {
    setError(null);
    await manualRetry(() => fetchOrdens(true));
  }, [manualRetry]);



  const filteredOrdens = useMemo(() => {
    let filtered = ordens;

    // Filtro por aba
    if (activeTab === 'abertas') {
      filtered = filtered.filter(ordem => 
        ordem.statusOS !== 'Entregue' && 
        ordem.statusOS !== 'Cancelada'
      );
    } else if (activeTab === 'entregues') {
      filtered = filtered.filter(ordem => ordem.statusOS === 'Entregue');
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ordem => 
        ordem.numero.toString().includes(term) ||
        ordem.cliente.toLowerCase().includes(term) ||
        ordem.aparelho.toLowerCase().includes(term) ||
        ordem.servico.toLowerCase().includes(term) ||
        ordem.tecnico.toLowerCase().includes(term)
      );
    }

    // Filtros específicos
    if (statusFilter) {
      filtered = filtered.filter(ordem => ordem.statusOS === statusFilter);
    }
    if (aparelhoFilter) {
      filtered = filtered.filter(ordem => ordem.aparelhoCategoria === aparelhoFilter);
    }
    if (tecnicoFilter) {
      filtered = filtered.filter(ordem => ordem.tecnico === tecnicoFilter);
    }
    if (tipoFilter) {
      filtered = filtered.filter(ordem => ordem.tipo === tipoFilter);
    }

    return filtered;
  }, [ordens, activeTab, searchTerm, statusFilter, aparelhoFilter, tecnicoFilter, tipoFilter]);

  const contadores = useMemo(() => {
    const reparoConcluido = ordens.filter(os => {
      const statusTecnico = (os.statusTecnico || '').toLowerCase();
      return statusTecnico.includes('reparo concluído') || statusTecnico.includes('reparo concluido');
    }).length;
    
    const concluidas = ordens.filter(os => {
      const statusConcluidos = ['entregue', 'finalizado', 'concluído', 'reparo concluído'];
      return statusConcluidos.includes(os.statusOS.toLowerCase());
    }).length;
    
    const orcamentos = ordens.filter(os => {
      const statusOrcamento = ['orçamento', 'orçamento enviado', 'aguardando aprovação'];
      return statusOrcamento.includes(os.statusOS.toLowerCase());
    }).length;
    
    const aguardandoRetirada = ordens.filter(os => {
      const stOs = (os.statusOS || '').toUpperCase();
      const stTec = (os.statusTecnico || '').toUpperCase();
      return stOs === 'AGUARDANDO RETIRADA' || stTec === 'AGUARDANDO RETIRADA';
    }).length;
    
    const aprovadas = ordens.filter(os => {
      const stOs = (os.statusOS || '').toUpperCase();
      const stTec = (os.statusTecnico || '').toUpperCase();
      return stOs === 'APROVADO' || stTec === 'APROVADO';
    }).length;
    
    const laudoPronto = ordens.filter(os => {
      const stTec = (os.statusTecnico || '').toUpperCase();
      return stTec === 'ORÇAMENTO ENVIADO' || stTec === 'ORCAMENTO ENVIADO' || stTec === 'AGUARDANDO APROVAÇÃO' || stTec === 'AGUARDANDO APROVACAO';
    }).length;
    
    const retornos = ordens.filter(os => {
      return os.tipo === 'Retorno' || (os.osGarantiaId && os.osGarantiaId.trim() !== '');
    }).length;
    
    const todas = ordens.length;
    const abertas = ordens.filter(ordem => 
      ordem.statusOS !== 'Entregue' && 
      ordem.statusOS !== 'Cancelada'
    ).length;
    const entregues = ordens.filter(ordem => ordem.statusOS === 'Entregue').length;
    
    return { reparoConcluido, concluidas, orcamentos, aguardandoRetirada, aprovadas, laudoPronto, retornos, todas, abertas, entregues };
  }, [ordens]);

  // Handlers


  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleAparelhoFilterChange = (value: string) => {
    setAparelhoFilter(value);
    setCurrentPage(1);
  };

  const handleTecnicoFilterChange = (value: string) => {
    setTecnicoFilter(value);
    setCurrentPage(1);
  };

  const handleTipoFilterChange = (value: string) => {
    setTipoFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ✅ CORREÇÃO: Aguardar autenticação antes de carregar dados
  useEffect(() => {
    setIsMounted(true);
  }, []); // Executar apenas uma vez

  useEffect(() => {
    if (!authLoading && empresaData?.id && usuarioData?.auth_user_id) {
      setWaitingForAuth(false);
    }
  }, [authLoading, empresaData?.id, usuarioData?.auth_user_id]);

  // useEffect para carregar dados
  useEffect(() => {
    if (!waitingForAuth && isMounted && !authLoading) {
      fetchOrdens(true);
    }
  }, [waitingForAuth, isMounted, authLoading]);
  
  // ✅ CORREÇÃO: Mostrar loading enquanto aguarda autenticação
  if (!isMounted || waitingForAuth) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados da empresa...</p>
          </div>
        </div>
      </div>
    );
  }
  

  function formatDate(date: string) {
    if (!date) return '';
    // Trata YYYY-MM-DD como data local (evita -1 dia por timezone)
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mm, dd] = m;
      return `${dd}/${mm}/${y}`;
    }
    return new Date(date).toLocaleDateString('pt-BR');
  }

  const toDateOnlyString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const addDaysDateOnly = (dateOnly: string, days: number): string => {
    const m = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return dateOnly;
    const y = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(y, mm - 1, dd + days);
    return toDateOnlyString(d);
  };

  function formatPhoneNumber(phone: string) {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  }

  function formatFormaPagamento(forma: string) {
    const formas: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_debito': 'Cartão Débito',
      'cartao_credito': 'Cartão Crédito',
      'transferencia': 'Transferência',
      'boleto': 'Boleto',
      'cheque': 'Cheque'
    };
    return formas[forma] || forma;
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'concluido':
      case 'finalizado':
      case 'reparo concluído':
      case 'entregue':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'orcamento':
      case 'orçamento':
      case 'orçamento enviado':
      case 'aprovado':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'analise':
      case 'em analise':
      case 'em análise':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'aguardando inicio':
      case 'aguardando início':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'aguardando peca':
      case 'aguardando peça':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'em execucao':
      case 'em execução':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'sem reparo':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'nao aprovado':
      case 'não aprovado':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusTecnicoColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'aguardando início':
      case 'aguardando inicio':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'em análise':
      case 'em analise':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'orçamento enviado':
      case 'orcamento enviado':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'aguardando peça':
      case 'aguardando peca':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'em execução':
      case 'em execucao':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'sem reparo':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'reparo concluído':
      case 'reparo concluido':
      case 'finalizada':
      case 'finalizado':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Função para determinar forma de pagamento com fallback inteligente
  const getFormaPagamento = (item: any, vendaOS: any): string => {
    // 1. Se há venda específica registrada, usar ela
    if (vendaOS?.forma_pagamento) {
      return vendaOS.forma_pagamento;
    }
    
    // 2. Se a O.S. não foi faturada, não há forma de pagamento
    const valorFaturado = item.valor_faturado || 0;
    const foiFaturada = valorFaturado > 0 && (item.status === 'ENTREGUE' || item.status_tecnico === 'FINALIZADA');
    
    if (!foiFaturada) {
      return 'N/A';
    }
    
    // 3. Fallback inteligente baseado no valor e data
    const valorTotal = ((item.valor_peca || 0) * (item.qtd_peca || 1)) + ((item.valor_servico || 0) * (item.qtd_servico || 1));
    
    // Para valores pequenos (até R$ 50), geralmente é dinheiro
    if (valorTotal <= 50) {
      return 'dinheiro';
    }
    // Para valores médios (R$ 50-200), geralmente é PIX
    else if (valorTotal <= 200) {
      return 'pix';
    }
    // Para valores altos, geralmente é cartão
    else {
      return 'cartao_debito';
    }
  };

  const fetchOrdens = async (forceRefresh = false) => {
    if (!validateCompanyData(false)) {
      setLoading(false);
      return;
    }

    const empresaId = getCompanyId();
    if (!empresaId) {
      setLoading(false);
      return;
    }

    // Cache simples - evitar buscar dados se já foram buscados recentemente
    const now = Date.now();
    const currentCacheKey = `ordens_${empresaId}`;
    
    if (!forceRefresh && 
        cacheKey === currentCacheKey && 
        now - lastFetchTime < 60000 && // Aumentar cache para 60 segundos
        ordens.length > 0) {
      setLoading(false);
      setLoadingOrdens(false);
      return;
    }

    setLoadingOrdens(true);
    setError(null);
    
    try {
      // Query simplificada - apenas dados essenciais
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          id,
          numero_os,
          cliente_id,
          categoria,
          marca,
          modelo,
          status,
          status_tecnico,
          created_at,
          tecnico_id,
          valor_faturado,
          valor_peca,
          valor_servico,
          desconto,
          servico,
          tipo,
          clientes!left(nome, telefone),
          tecnico:usuarios!left(nome)
        `)
        .eq("empresa_id", empresaId)
        .order('created_at', { ascending: false })
        .limit(100); // Aumentar limite mas manter razoável

      if (error) {
        console.error('Erro ao carregar OS:', error);
        addToast('error', 'Erro ao carregar ordens de serviço.');
        setLoadingOrdens(false);
        return;
      }

      if (data) {
        const mapped = data.map((item: any) => {
          const valorFaturado = item.valor_faturado || 0;
          
          return {
            id: item.id,
            numero: item.numero_os || 0,
            cliente: item.clientes?.nome || 'Cliente não informado',
            clienteTelefone: item.clientes?.telefone ? formatPhoneNumber(item.clientes.telefone) : '',
            clienteEmail: '',
            aparelho: item.modelo || item.marca || item.categoria || 'N/A',
            aparelhoCategoria: item.categoria || '',
            aparelhoMarca: item.marca || '',
            servico: item.servico || 'N/A',
            statusOS: item.status || 'N/A',
            statusTecnico: item.status_tecnico || 'N/A',
            entrada: item.created_at || '',
            tecnico: item.tecnico?.nome || 'N/A',
            atendente: 'N/A',
            entrega: '',
            prazoEntrega: '',
            garantia: '',
            valorPeca: item.valor_peca || 0,
            valorServico: item.valor_servico || 0,
            desconto: item.desconto || 0,
            valorTotal: (item.valor_peca || 0) + (item.valor_servico || 0),
            valorComDesconto: (item.valor_peca || 0) + (item.valor_servico || 0) - (item.desconto || 0),
            valorFaturado: valorFaturado,
            tipo: item.tipo || 'Nova',
            foiFaturada: valorFaturado > 0,
            formaPagamento: valorFaturado > 0 ? 'pix' : 'N/A',
            osGarantiaId: null,
            observacao: null,
          };
        });

        setOrdens(mapped);
        setTotalOS(mapped.length);
        setPercentualRetornos(0); // Simplificar cálculo
      }
      
      // Atualizar cache
      setLastFetchTime(now);
      setCacheKey(currentCacheKey);
      
    } catch (error) {
      setError(error);
      console.error('Erro ao carregar ordens:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.warn('⚠️ Timeout detectado');
          addToast('error', 'Dados demorando para carregar. Tente novamente.');
        } else if (error.message.includes('conectar com o servidor')) {
          addToast('error', 'Problema de conexão com servidor. Tente novamente.');
        } else {
          addToast('error', 'Erro ao carregar ordens. Tente novamente.');
        }
      } else {
        console.warn('⚠️ Erro desconhecido:', error);
        addToast('error', 'Erro inesperado. Tente recarregar a página.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função loadTecnicos removida para melhorar performance

  const handleStatusChange = (ordemId: string, newStatus: string, newStatusTecnico: string) => {
    setOrdens(prevOrdens => 
      prevOrdens.map(os => 
        os.id === ordemId 
          ? { ...os, statusOS: newStatus, statusTecnico: newStatusTecnico }
          : os
      )
    );
  };

  // Função loadTecnicos removida para melhorar performance

  const totalPages = Math.ceil(filteredOrdens.length / itemsPerPage);
  const paginated = filteredOrdens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  // ✅ OTIMIZADO: Loading states mais inteligentes
  const empresaId = getCompanyId();
  if (!empresaId) {
    return (
      <MenuLayout>
        <OSFullPageSkeleton />
      </MenuLayout>
    );
  }
  
  if (loading && ordens.length === 0) {
    return (
      <MenuLayout>
        <OSFullPageSkeleton />
      </MenuLayout>
    );
  }

  if (loadingOrdens && ordens.length === 0) {
    return (
      <MenuLayout>
        <OSFullPageSkeleton />
        {retryState.isRetrying && (
          <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">
                Tentativa {retryState.currentAttempt} de 3...
              </span>
            </div>
          </div>
        )}
      </MenuLayout>
    );
  }

  // Estado de erro
  if (error && !loading) {
    return (
      <MenuLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Não foi possível carregar as ordens
            </h3>
            <p className="text-gray-600 mb-4">
              Verifique sua conexão e tente novamente
            </p>
            {retryState.isRetrying && (
              <p className="text-blue-600 text-sm mb-4">
                Tentativa {retryState.currentAttempt} de 3...
              </p>
            )}
            <Button onClick={handleRetry} disabled={retryState.isRetrying}>
              <FiRefreshCw className={`w-4 h-4 mr-2 ${retryState.isRetrying ? 'animate-spin' : ''}`} />
              {retryState.isRetrying ? 'Tentando...' : 'Tentar novamente'}
            </Button>
          </div>
        </div>
      </MenuLayout>
    );
  }

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Calcular métricas diárias
  const hojeAgora = new Date();
  const inicioDia = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate());
  const fimDia = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate() + 1);

  const osHoje = ordens.filter(os => {
    // Converter a data de entrada para data local sem timezone
    let dataOS: Date;
    if (typeof os.entrada === 'string') {
      // Se for string YYYY-MM-DD, tratar como data local
      const match = os.entrada.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        dataOS = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        dataOS = new Date(os.entrada);
      }
    } else {
      dataOS = new Date(os.entrada);
    }
    
    return dataOS >= inicioDia && dataOS < fimDia;
  }).length;

  const faturamentoHoje = ordens.filter(os => {
    const dataOS = new Date(os.entrada);
    return dataOS >= inicioDia && dataOS < fimDia && os.valorFaturado;
  }).reduce((sum: number, o: any) => sum + (o.valorFaturado || 0), 0);

  const ticketMedioHoje = osHoje > 0 ? faturamentoHoje / osHoje : 0;

  const retornosHoje = ordens.filter(os => {
    const dataOS = new Date(os.entrada);
    const isHoje = dataOS >= inicioDia && dataOS < fimDia;
    const isRetorno = os.tipo === 'Retorno' || (os.osGarantiaId && os.osGarantiaId.trim() !== '');
    return isHoje && isRetorno;
  }).length;

  const aprovadosHoje = ordens.filter(os => {
    const dataOS = new Date(os.entrada);
    return dataOS >= inicioDia && dataOS < fimDia && 
           (os.statusOS?.toLowerCase() === 'aprovado' || 
            os.statusTecnico?.toLowerCase() === 'aprovado');
  }).length;

  // ✅ CORREÇÃO: Evitar renderização de componentes dinâmicos antes da hidratação
  if (!isMounted) {
    return (
      <MenuLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </MenuLayout>
    );
  }
  
  // ✅ OTIMIZADO: Validação com timeout para evitar loops
  if (!validateCompanyData()) {
    return (
      <MenuLayout>
        <OSFullPageSkeleton />
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
        <div className="p-4 md:p-8">
          {/* Header com título e botão */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ordens de Serviço pedro</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Gerencie todas as ordens de serviço da sua empresa
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                onClick={() => fetchOrdens(true)}
                variant="outline"
                size="lg"
                disabled={loadingOrdens || retryState.isRetrying}
                className="px-4 py-3 text-sm font-semibold"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${(loadingOrdens || retryState.isRetrying) ? 'animate-spin' : ''}`} />
                {retryState.isRetrying ? `Tentando... (${retryState.currentAttempt}/3)` : 
                 loadingOrdens ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button
                onClick={() => router.push("/nova-os")}
                size="lg"
                className="bg-black text-white hover:bg-neutral-800 px-6 md:px-8 py-3 text-sm md:text-base font-semibold shadow-lg flex-1 md:flex-none"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Nova OS
              </Button>
            </div>
          </div>

          {/* Cards principais - Dados Diários */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <DashboardCard
              title="OS do Dia"
              value={osHoje}
              description={`Total: ${totalOS}`}
              descriptionColorClass="text-gray-600"
              icon={<FiFileText className="w-5 h-5" />}
              svgPolyline={{ color: '#84cc16', points: '0,20 10,15 20,17 30,10 40,12 50,8 60,10 70,6' }}
            >
              <div className="mt-2">
                <button 
                  onClick={() => router.push('/financeiro/detalhamento-mes')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver mês completo →
                </button>
              </div>
            </DashboardCard>
            <DashboardCard
              title="Faturamento do Dia"
              value={formatCurrency(faturamentoHoje)}
              description={`Ticket médio: ${formatCurrency(ticketMedioHoje)}`}
              descriptionColorClass="text-green-600"
              icon={<FiDollarSign className="w-5 h-5" />}
              svgPolyline={{ color: '#4ade80', points: '0,18 10,16 20,14 30,10 40,11 50,9 60,10 70,6' }}
            >
              <div className="mt-2">
                <button 
                  onClick={() => router.push('/financeiro/detalhamento-mes')}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  Ver mês completo →
                </button>
              </div>
            </DashboardCard>
            <DashboardCard
              title="Retornos do Dia"
              value={retornosHoje}
              description={`${percentualRetornos}% do total`}
              descriptionColorClass="text-red-500"
              icon={<FiRefreshCw className="w-5 h-5" />}
              svgPolyline={{ color: '#f87171', points: '0,12 10,14 20,16 30,18 40,20 50,17 60,15 70,16' }}
            >
              <div className="mt-2">
                <button 
                  onClick={() => router.push('/financeiro/detalhamento-mes')}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Ver mês completo →
                </button>
              </div>
            </DashboardCard>
            <DashboardCard
              title="Aprovados do Dia"
              value={aprovadosHoje}
              description={`OS aprovadas hoje`}
              descriptionColorClass="text-purple-600"
              icon={<FiCheckCircle className="w-5 h-5" />}
              svgPolyline={{ color: '#a855f7', points: '0,15 10,18 20,16 30,19 40,17 50,20 60,18 70,20' }}
            >
              <div className="mt-2">
                <button 
                  onClick={() => router.push('/financeiro/detalhamento-mes')}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  Ver mês completo →
                </button>
              </div>
            </DashboardCard>
          </div>

          {/* Abas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row border-b md:border-b-0 border-gray-200">
              <button
                onClick={() => handleTabChange('todas')}
                aria-label="Mostrar todas as ordens de serviço"
                aria-pressed={activeTab === 'todas'}
                className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm border-b-2 md:border-b-2 border-r-0 md:border-r-0 transition-colors ${
                  activeTab === 'todas'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todas
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'todas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.todas}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('reparo_concluido')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'reparo_concluido'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Reparo Concluído
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'reparo_concluido' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.reparoConcluido}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('orcamentos')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'orcamentos'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Orçamentos
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'orcamentos' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.orcamentos}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('aprovadas')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'aprovadas'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Aprovadas
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'aprovadas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.aprovadas}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('laudo_pronto')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'laudo_pronto'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Laudo Pronto
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'laudo_pronto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.laudoPronto}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('aguardando_retirada')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'aguardando_retirada'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                                 Aguardando Retirada
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'aguardando_retirada' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.aguardandoRetirada}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('concluidas')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'concluidas'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                                 Concluídas
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'concluidas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.concluidas}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('retornos')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'retornos'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Retornos
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === 'retornos' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contadores.retornos}
                </span>
              </button>
          </div>
        </div>

          {/* Filtros e busca */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Busca */}
              <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                  placeholder="Buscar por OS, cliente, aparelho ou serviço..."
                    value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-full"
                  />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-48"
                >
                  <option value="">Todos os Status</option>
                                     <option value="concluido">Concluído</option>
                   <option value="pendente">Pendente</option>
                   <option value="orcamento">Orçamento</option>
                   <option value="analise">Análise</option>
                   <option value="nao aprovado">Não Aprovado</option>
                </Select>

                <Select
                  value={tipoFilter}
                  onChange={(e) => handleTipoFilterChange(e.target.value)}
                  className="w-40"
                >
                  <option value="">Todos os Tipos</option>
                                     <option value="Nova">Nova</option>
                   <option value="Retorno">Retorno</option>
                </Select>

                <Select
                  value={tecnicoFilter}
                  onChange={(e) => handleTecnicoFilterChange(e.target.value)}
                  className="w-48"
                >
                  <option value="">Todos os Técnicos</option>
                  {tecnicos.map(tecnico => (
                    <option key={tecnico} value={tecnico}>{tecnico}</option>
                  ))}
                </Select>

                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setTipoFilter('');
                    setTecnicoFilter('');
                    setAparelhoFilter('');
                    setActiveTab('reparo_concluido');
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FiFilter className="w-4 h-4" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                {filteredOrdens.length} de {ordens.length} ordens encontradas
              </span>
              {isMounted && loading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span>Carregando...</span>
                </div>
              )}
          </div>
        </div>

        {/* Tabela - Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="w-full">
            <table className="w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-20" />
                  <col className="w-16" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-16" />
                  <col className="w-20" />
                  <col className="w-16" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-16" />
                </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <FiFileText className="w-3 h-3" />
                      <span className="hidden sm:inline">OS</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <FiRefreshCw className="w-3 h-3" />
                      <span className="hidden sm:inline">Tipo</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <FiSmartphone className="w-3 h-3" />
                      <span className="hidden sm:inline">Aparelho</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Serviço</span>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                      <span className="hidden sm:inline">Prazo</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Garantia</span>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" />
                        <span className="hidden sm:inline">Total</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <FiUser className="w-3 h-3" />
                      <span className="hidden sm:inline">Técnico</span>
                    </div>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="hidden sm:inline">Status</span>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="hidden sm:inline">Status Técnico</span>
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" />
                      <span className="hidden sm:inline">Faturado</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((os) => {
                  const isRetorno = os.tipo === 'Retorno' || (os.osGarantiaId && os.osGarantiaId.trim() !== '');
                  
                  return (
                    <tr 
                      key={os.id} 
                      className={`hover:bg-blue-50 hover:shadow-sm transition-all duration-200 cursor-pointer group ${
                        isRetorno ? 'border-l-4 border-l-red-400 bg-red-50/30' : ''
                      }`}
                      onClick={() => router.push(`/ordens/${os.id}`)}
                    >
                      <td className="px-1 py-2 relative">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-900 text-xs group-hover:text-blue-600 transition-colors">#{os.numero}</span>
                          {isRetorno && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                          )}
                        </div>
                      <div className="text-xs text-gray-600 font-medium truncate min-w-0 group-hover:text-gray-900 transition-colors">{os.cliente || 'N/A'}</div>
                      <div className="text-xs text-gray-500 truncate">{os.clienteTelefone || 'N/A'}</div>
                      <div className="text-xs text-gray-400 truncate">{formatDate(os.entrada) || 'N/A'}</div>
                      {/* Indicador de recusa - ponto vermelho no canto superior direito da célula */}
                      {os.observacao?.includes('🚫 CLIENTE RECUSOU ORÇAMENTO') && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full shadow-sm border border-white" title="Cliente recusou orçamento"></div>
                      )}
                    </td>
                    <td className="px-1 py-2">
                      {isRetorno ? (
                        <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <FiRefreshCw className="w-3 h-3 mr-0.5" />
                          <span className="hidden sm:inline">Retorno</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <FiPlus className="w-3 h-3 mr-0.5" />
                          <span className="hidden sm:inline">Nova</span>
                        </span>
                      )}
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs font-medium text-gray-900 truncate min-w-0">{os.aparelho || 'N/A'}</div>
                      {(os.aparelhoCategoria || os.aparelhoMarca) && (
                        <div className="text-xs text-gray-500 truncate">
                          {[os.aparelhoCategoria, os.aparelhoMarca].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900 min-w-0">
                        <div className="font-medium truncate">{os.servico || 'Aguardando'}</div>
                        <div className="text-gray-600 font-semibold">{formatCurrency(os.valorTotal)}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-600 min-w-0">
                        <div className="mb-1">
                          <span className="font-medium text-gray-700">
                            {formatDate(os.prazoEntrega) || 'Não definido'}
                          </span>
                        </div>
                        <div className={`text-xs ${
                          os.entrega && os.entrega !== 'Aguardando retirada' 
                            ? 'text-green-600' 
                            : 'text-gray-500'
                        }`}>
                          {formatDate(os.entrega) || 'Aguardando'}
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className={`text-xs font-medium min-w-0 ${
                        os.garantia && new Date(os.garantia) < new Date()
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        <div className="whitespace-nowrap">{formatDate(os.garantia) || 'Aguardando'}</div>
                        {os.garantia && (
                          <div className="text-xs text-gray-500 truncate">
                            {new Date(os.garantia).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
                              ? 'Expirada'
                              : `${Math.max(0, Math.ceil((new Date(os.garantia).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)))} dias restantes`
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs font-bold text-green-600 whitespace-nowrap min-w-0">
                        {formatCurrency(os.valorTotal) || 'R$ 0,00'}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900 truncate min-w-0">{os.tecnico || 'N/A'}</div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium truncate max-w-full ${getStatusColor(os.statusOS)}`}>
                          {os.statusOS || 'N/A'}
                        </span>
                        {isRetorno && (
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium truncate max-w-full ${getStatusTecnicoColor(os.statusTecnico)}`}>
                            {os.statusTecnico || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs min-w-0">
                        {os.foiFaturada ? (
                          <>
                            <div className="font-bold text-green-600">
                              Faturado
                            </div>
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              {formatFormaPagamento(os.formaPagamento)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-500 font-medium">
                              Aguardando
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Cards Mobile - Layout responsivo para mobile */}
          <div className="md:hidden space-y-4">
            {paginated.map((os) => (
              <div 
                key={os.id} 
                className={`relative bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  os.tipo === 'Retorno' || (os.osGarantiaId && os.osGarantiaId.trim() !== '') ? 'border-l-4 border-l-red-400 bg-red-50/30' : ''
                }`}
                onClick={() => router.push(`/ordens/${os.id}`)}
              >
                {/* Indicador de recusa - ponto vermelho no canto superior direito */}
                {os.observacao?.includes('🚫 CLIENTE RECUSOU ORÇAMENTO') && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm z-10" title="Cliente recusou orçamento"></div>
                )}
                {/* Header do card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">#{os.numero}</span>
                    {(os.tipo === 'Retorno' || (os.osGarantiaId && os.osGarantiaId.trim() !== '')) && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(os.statusOS)}`}>
                    {os.statusOS}
                  </div>
                </div>

                {/* Cliente */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900">{os.cliente || 'N/A'}</div>
                  <div className="text-xs text-gray-600">{os.clienteTelefone || 'N/A'}</div>
                </div>

                {/* Aparelho e Serviço */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-800">{os.aparelho || 'N/A'}</div>
                  <div className="text-xs text-gray-600">{os.servico || 'Aguardando'}</div>
                </div>

                {/* Informações técnicas */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                  <div>
                    <div className="text-gray-500">Técnico</div>
                    <div className="font-medium text-gray-900">{os.tecnico || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-medium text-gray-900">{formatCurrency(os.valorTotal)}</div>
                  </div>
                </div>

                {/* Status técnico e faturado */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-gray-500">Status Técnico</div>
                    <div className="font-medium text-gray-900">{os.statusTecnico || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">Faturado</div>
                    <div className={`font-medium ${os.foiFaturada ? 'text-green-600' : 'text-gray-500'}`}>
                      {os.foiFaturada ? 'Faturado' : 'Aguardando'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado vazio */}
            {!loading && paginated.length === 0 && (
              <div className="text-center py-12">
                <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ordem encontrada</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter || tipoFilter || tecnicoFilter 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando sua primeira ordem de serviço'
                  }
                </p>
                {!searchTerm && !statusFilter && !tipoFilter && !tecnicoFilter && (
                  <Button
                    onClick={() => router.push("/nova-os")}
                    className="bg-black text-white hover:bg-neutral-800"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Criar Primeira OS
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                variant="outline"
                size="sm"
                  disabled={currentPage === 1}
                >
                  Anterior
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                variant="outline"
                size="sm"
                  disabled={currentPage === totalPages}
                >
                  Próxima
              </Button>
              </div>
          )}
        
        {/* Alerta de Laudos Prontos */}
        <LaudoProntoAlert />
      </MenuLayout>
  );
}
