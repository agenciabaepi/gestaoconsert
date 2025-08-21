'use client';

import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { useRouter } from 'next/navigation';
import { FiCpu, FiEye, FiBell, FiCheckCircle, FiClock, FiTool, FiPackage } from 'react-icons/fi';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import VisualizarOSModal from '@/components/VisualizarOSModal';

export default function BancadaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  
  // Estados para abas e notificações
  const [activeTab, setActiveTab] = useState('pendentes');
  const [notificacoesLidas, setNotificacoesLidas] = useState<string[]>([]);

  interface OrdemServico {
    id: string;
    empresa_id: string;
    cliente_id: string;
    tecnico_id: string;
    status: string;
    created_at: string;
    atendente: string;
    tecnico: string;
    categoria: string;
    marca: string;
    modelo: string;
    cor: string;
    numero_serie: string;
    servico: string;
    qtd_servico: string;
    peca: string;
    qtd_peca: string;
    termo_garantia: string | null;
    relato: string;
    observacao: string;
    data_cadastro: string;
    numero_os: string;
    data_entrega: string | null;
    vencimento_garantia: string | null;
    valor_peca: string;
    valor_servico: string;
    desconto: string | null;
    valor_faturado: string;
    status_tecnico: string;
    acessorios: string;
    condicoes_equipamento: string;
    cliente?: {
      nome: string;
      telefone?: string;
    };
    [key: string]: unknown;
  }

  useEffect(() => {
    const fetchOrdens = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Buscar ordens atribuídas ao técnico OU sem técnico definido (para poder assumir)
        const { data: ordensData, error: ordensError } = await supabase
          .from('ordens_servico')
          .select(`
            *,
            cliente:cliente_id(nome, telefone)
          `)
          .or(`tecnico_id.eq.${user.id},tecnico_id.is.null`)
          .order('created_at', { ascending: false });

        if (ordensError) {
          console.error('Erro ao buscar ordens:', ordensError);
        } else {
          setOrdens(ordensData || []);
          // Debug: mostrar status das OSs carregadas
          console.log('OSs carregadas para o técnico:', ordensData?.length || 0);
          console.log('Status das OSs:', ordensData?.map(os => ({ id: os.id, numero_os: os.numero_os, status: os.status })) || []);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && !authLoading) fetchOrdens();
  }, [user, authLoading]);
  
  // Filtros e contadores por aba
  const filteredOrdens = useMemo(() => {
    return ordens.filter(os => {
      const matchesSearch = searchTerm === '' || 
        (os.cliente?.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (os.numero_os || os.id).toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = filtroStatus === 'Todos' || os.status === filtroStatus;
      
      // Filtro por aba
      let matchesTab = true;
      if (activeTab === 'pendentes') {
        // OS pendentes/aguardando - status de início
        const statusPendentes = ['ABERTA', 'EM_ANALISE', 'ORCAMENTO', 'ORÇAMENTO', 'PENDENTE'];
        matchesTab = statusPendentes.includes(os.status);
      } else if (activeTab === 'aprovadas') {
        // OS aprovadas - que precisam de ação do técnico
        matchesTab = os.status === 'APROVADO';
      } else if (activeTab === 'em_andamento') {
        // OS em andamento
        const statusAndamento = ['EM_EXECUCAO', 'AGUARDANDO_PECA'];
        matchesTab = statusAndamento.includes(os.status);
      } else if (activeTab === 'concluidas') {
        // OS concluídas
        const statusConcluidas = ['CONCLUIDO', 'ENTREGUE'];
        matchesTab = statusConcluidas.includes(os.status);
      } else if (activeTab === 'todas') {
        // Todas as OSs
        matchesTab = true;
      }
      
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [ordens, searchTerm, filtroStatus, activeTab]);
  
  // Contadores para as abas
  const contadores = useMemo(() => {
    const pendentes = ordens.filter(os => ['ABERTA', 'EM_ANALISE', 'ORCAMENTO', 'ORÇAMENTO', 'PENDENTE'].includes(os.status)).length;
    const aprovadas = ordens.filter(os => os.status === 'APROVADO').length;
    const emAndamento = ordens.filter(os => ['EM_EXECUCAO', 'AGUARDANDO_PECA'].includes(os.status)).length;
    const concluidas = ordens.filter(os => ['CONCLUIDO', 'ENTREGUE'].includes(os.status)).length;
    
    return { pendentes, aprovadas, emAndamento, concluidas, todas: ordens.length };
  }, [ordens]);
  
  // OS aprovadas não lidas (para notificações)
  const osAprovadas = useMemo(() => {
    return ordens.filter(os => 
      os.status === 'APROVADO' && !notificacoesLidas.includes(os.id)
    );
  }, [ordens, notificacoesLidas]);
  
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  
  const marcarNotificacaoLida = useCallback((osId: string) => {
    setNotificacoesLidas(prev => [...prev, osId]);
  }, []);

  const iniciarOrdem = async (id: string) => {
    // Se a OS está aguardando início, mudar para "em análise" automaticamente
    const ordem = ordens.find(os => os.id === id);
    if (ordem && ordem.status === 'ABERTA') {
      try {
        console.log('Iniciando ordem:', id);
        
        // Buscar status fixos para obter os nomes corretos
        const { data: statusFixos, error: statusError } = await supabase
          .from('status_fixo')
          .select('*')
          .eq('tipo', 'os');

        if (statusError) {
          console.error('Erro ao buscar status fixos:', statusError);
          return;
        }

        console.log('Status fixos encontrados:', statusFixos);

        // Encontrar o status "EM ANÁLISE" nos status fixos
        const statusEmAnalise = statusFixos?.find(s => s.nome === 'EM ANÁLISE');
        
        if (statusEmAnalise) {
          console.log('Status EM ANÁLISE encontrado:', statusEmAnalise);
          
          const { error: updateError } = await supabase
            .from('ordens_servico')
            .update({ 
              status: statusEmAnalise.nome,
              status_tecnico: 'EM ANÁLISE'
            })
            .eq('id', id);

          if (updateError) {
            console.error('Erro ao atualizar status:', updateError);
            alert('Erro ao iniciar a ordem. Tente novamente.');
            return;
          } else {
            console.log('Status atualizado com sucesso');
            // Atualizar a lista local
            setOrdens(prevOrdens => 
              prevOrdens.map(os => 
                os.id === id 
                  ? { ...os, status: statusEmAnalise.nome, status_tecnico: 'EM ANÁLISE' }
                  : os
              )
            );
          }
        } else {
          console.error('Status "EM ANÁLISE" não encontrado nos status fixos');
          alert('Erro: Status "EM ANÁLISE" não encontrado. Verifique a configuração do sistema.');
          return;
        }
      } catch (error) {
        console.error('Erro ao iniciar ordem:', error);
        alert('Erro ao iniciar a ordem. Tente novamente.');
        return;
      }
    }
    
    // Redirecionar para a página de edição
    router.push(`/bancada/${id}`);
  };

  const abrirModal = (ordem: OrdemServico) => {
    setOrdemSelecionada(ordem);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setOrdemSelecionada(null);
  };

  if (loading) {
    return (
      <ProtectedArea area="bancada">
        <MenuLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando...</p>
              </div>
            </div>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiCpu className="text-blue-600" />
              Minha Bancada
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Notificações */}
              {osAprovadas.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiBell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Orçamentos Aprovados!</p>
                      <p className="text-sm font-bold text-green-800">
                        {osAprovadas.length} OS{osAprovadas.length > 1 ? 's' : ''} aprovada{osAprovadas.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
              
              {/* Card de resumo */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FiCpu className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hoje</p>
                    <p className="text-lg font-bold text-gray-900">{contadores.pendentes} OSs pendentes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Abas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => handleTabChange('pendentes')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'pendentes'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  Pendentes
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'pendentes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contadores.pendentes}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleTabChange('aprovadas')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors relative ${
                  activeTab === 'aprovadas'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" />
                  Aprovadas
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'aprovadas' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contadores.aprovadas}
                  </span>
                  {osAprovadas.length > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => handleTabChange('em_andamento')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'em_andamento'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiTool className="w-4 h-4" />
                  Em Andamento
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'em_andamento' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contadores.emAndamento}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleTabChange('concluidas')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'concluidas'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" />
                  Concluídas
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'concluidas' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contadores.concluidas}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleTabChange('todas')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'todas'
                    ? 'border-gray-500 text-gray-600 bg-gray-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiPackage className="w-4 h-4" />
                  Todas
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'todas' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contadores.todas}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cliente ou número da OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Abertas', value: 'ABERTA' },
                { label: 'Em Análise', value: 'EM_ANALISE' },
                { label: 'Aguardando Peça', value: 'AGUARDANDO_PECA' },
                { label: 'Concluídas', value: 'CONCLUIDO' },
                { label: 'Todas', value: 'Todos' }
              ].map((status) => {
                const count = status.value === 'Todos' 
                  ? ordens.length 
                  : ordens.filter(os => os.status === status.value).length;
                
                return (
                  <button
                    key={status.value}
                    onClick={() => setFiltroStatus(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      filtroStatus === status.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de OSs */}
          <div className="space-y-4">
            {filteredOrdens.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiCpu size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ordem encontrada</h3>
                <p className="text-gray-500">
                  {activeTab === 'pendentes' && 'Não há ordens pendentes no momento.'}
                  {activeTab === 'aprovadas' && 'Não há ordens aprovadas no momento.'}
                  {activeTab === 'em_andamento' && 'Não há ordens em andamento no momento.'}
                  {activeTab === 'concluidas' && 'Não há ordens concluídas no momento.'}
                  {activeTab === 'todas' && 'Não há ordens de serviço atribuídas a você no momento.'}
                </p>
              </div>
            ) : (
              filteredOrdens.map((os) => {
                  const aparelho = [os.categoria, os.marca, os.modelo, os.cor].filter(Boolean).join(' ');
                  const entrada = os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '';
                  const valor = parseFloat(os.valor_servico || '0') + parseFloat(os.valor_peca || '0');
                  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'ABERTA': return 'bg-yellow-100 text-yellow-800';
                      case 'EM_ANALISE': return 'bg-blue-100 text-blue-800';
                      case 'AGUARDANDO_PECA': return 'bg-orange-100 text-orange-800';
                      case 'APROVADO': return 'bg-green-100 text-green-800';
                      case 'EM_EXECUCAO': return 'bg-purple-100 text-purple-800';
                      case 'CONCLUIDO': return 'bg-green-100 text-green-800';
                      case 'ENTREGUE': return 'bg-emerald-100 text-emerald-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case 'ABERTA': return 'Aguardando Início';
                      case 'EM_ANALISE': return 'Em Análise';
                      case 'AGUARDANDO_PECA': return 'Aguardando Peça';
                      case 'APROVADO': return 'Aprovado';
                      case 'EM_EXECUCAO': return 'Em Execução';
                      case 'CONCLUIDO': return 'Reparo Concluído';
                      case 'ENTREGUE': return 'Entregue';
                      default: return status;
                    }
                  };

                  const isAprovada = os.status === 'APROVADO';
                  const isNovaAprovacao = isAprovada && !notificacoesLidas.includes(os.id);
                  
                  return (
                    <div
                      key={os.id}
                      className={`bg-white p-6 rounded-xl shadow-sm transition-all duration-200 ${
                        isNovaAprovacao 
                          ? 'border-2 border-green-400 shadow-lg bg-gradient-to-r from-green-50 to-white animate-pulse'
                          : isAprovada
                          ? 'border border-green-200 bg-green-50'
                          : 'border border-gray-100 hover:shadow-md'
                      }`}
                      onClick={() => isNovaAprovacao && marcarNotificacaoLida(os.id)}
                    >
                      {/* Banner para OS aprovadas */}
                      {isAprovada && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-semibold text-green-800">
                                ✅ Orçamento Aprovado pelo Cliente!
                              </p>
                              <p className="text-xs text-green-600">
                                Você pode iniciar o reparo agora.
                              </p>
                            </div>
                            {isNovaAprovacao && (
                              <div className="ml-auto">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800 animate-bounce">
                                  NOVO!
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-gray-900">
                              #{os.numero_os || os.id} - {os.cliente?.nome || 'Cliente não informado'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>
                              {getStatusLabel(os.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Aparelho</p>
                              <p>{aparelho || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Cliente</p>
                              <p>{os.cliente?.nome || 'Não informado'}</p>
                              {os.cliente?.telefone && (
                                <p className="text-xs text-gray-500">{os.cliente.telefone}</p>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Entrada</p>
                              <p>{entrada}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Valor</p>
                              <p className="font-semibold text-blue-600">{valorFormatado}</p>
                            </div>
                          </div>

                          {os.relato && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 mb-1">Relato do Cliente</p>
                              <p className="text-sm text-gray-600 line-clamp-2">{os.relato}</p>
                            </div>
                          )}
                        </div>

                                                            <div className="ml-6 flex flex-col items-end">
                                      {os.status === 'ABERTA' ? (
                                        <button
                                          onClick={() => abrirModal(os)}
                                          className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
                                        >
                                          <FiEye size={16} /> 
                                          Visualizar
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => router.push(`/bancada/${os.id}`)}
                                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                          <FiCpu size={16} /> 
                                          Continuar
                                        </button>
                                      )}
                                      
                                      {os.status !== 'ABERTA' && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          Entrada: {entrada}
                                        </p>
                                      )}
                                    </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Modal */}
        <VisualizarOSModal
          isOpen={modalOpen}
          onClose={fecharModal}
          ordem={ordemSelecionada}
          onIniciar={iniciarOrdem}
        />
      </MenuLayout>
    </ProtectedArea>
  );
}