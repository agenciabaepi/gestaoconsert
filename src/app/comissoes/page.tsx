'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { useToast } from '@/components/Toast';
import { FiDollarSign, FiCalendar, FiTrendingUp, FiEye, FiDownload, FiFilter, FiX } from 'react-icons/fi';

interface ComissaoDetalhada {
  id: string;
  valor_servico: number;
  valor_peca: number;
  valor_total: number;
  percentual_comissao: number;
  valor_comissao: number;
  data_entrega: string;
  status: string;
  tipo_ordem: string;
  ordem_servico_id: string;
  numero_os?: string;
  cliente_nome?: string;
  servico_nome?: string;
  created_at: string;
}

interface FiltrosPeriodo {
  dataInicio: string;
  dataFim: string;
  status: string;
  tipoOrdem: string;
}

export default function ComissoesPage() {
  const { usuarioData } = useAuth();
  const { addToast } = useToast();
  
  const [comissoes, setComissoes] = useState<ComissaoDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosPeriodo>({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    status: '',
    tipoOrdem: ''
  });

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = comissoes.reduce((acc, c) => acc + c.valor_comissao, 0);
    const totalServicos = comissoes.reduce((acc, c) => acc + c.valor_servico, 0);
    const mediaComissao = comissoes.length > 0 ? total / comissoes.length : 0;
    const totalOSs = comissoes.length;
    
    return {
      totalComissao: total,
      totalServicos,
      mediaComissao,
      totalOSs
    };
  }, [comissoes]);

  // Filtrar comissões
  const comissoesFiltradas = useMemo(() => {
    return comissoes.filter(comissao => {
      const dataEntrega = new Date(comissao.data_entrega);
      const dataInicio = new Date(filtros.dataInicio);
      const dataFim = new Date(filtros.dataFim);
      
      const dentroPerido = dataEntrega >= dataInicio && dataEntrega <= dataFim;
      const statusMatch = !filtros.status || comissao.status === filtros.status;
      const tipoMatch = !filtros.tipoOrdem || comissao.tipo_ordem === filtros.tipoOrdem;
      
      return dentroPerido && statusMatch && tipoMatch;
    });
  }, [comissoes, filtros]);

  useEffect(() => {
    fetchComissoes();
  }, [usuarioData]);

  const fetchComissoes = async () => {
    console.log('🔍 Comissões - Dados do usuário:', usuarioData);
    
    if (!usuarioData?.auth_user_id) {
      console.log('❌ Comissões - Sem auth_user_id');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Comissões - Buscando com ID:', usuarioData.auth_user_id);
      
      // Buscar comissões usando a função RPC
      const { data: comissoesJSON, error } = await supabase
        .rpc('buscar_comissoes_tecnico', { 
          tecnico_id_param: usuarioData.auth_user_id 
        });

      console.log('📊 Comissões - Resultado RPC:', comissoesJSON);
      console.log('⚠️ Comissões - Erro RPC:', error);

      if (error) {
        console.error('Erro ao buscar comissões:', error);
        addToast('error', 'Erro ao carregar comissões: ' + error.message);
        setLoading(false);
        return;
      }

      // Converter JSON para array
      const comissoesArray = Array.isArray(comissoesJSON) ? comissoesJSON : (comissoesJSON || []);
      
      // Buscar detalhes adicionais das OSs
      if (comissoesArray.length > 0) {
        const osIds = comissoesArray.map(c => c.ordem_servico_id);
        
        const { data: osData, error: osError } = await supabase
          .from('ordens_servico')
          .select(`
            id,
            numero_os,
            servico,
            clientes:cliente_id(nome)
          `)
          .in('id', osIds);

        if (!osError && osData) {
          // Combinar dados
          const comissoesDetalhadas = comissoesArray.map(comissao => {
            const osInfo = osData.find(os => os.id === comissao.ordem_servico_id);
            return {
              ...comissao,
              numero_os: osInfo?.numero_os || 'N/A',
              cliente_nome: osInfo?.clientes?.nome || 'Cliente não encontrado',
              servico_nome: osInfo?.servico || 'Serviço não especificado'
            };
          });
          
          setComissoes(comissoesDetalhadas);
        } else {
          setComissoes(comissoesArray);
        }
      } else {
        setComissoes([]);
      }

    } catch (error) {
      console.error('💥 Comissões - Erro geral:', error);
      addToast('error', 'Erro ao carregar dados: ' + (error as Error).message);
    } finally {
      console.log('✅ Comissões - Finalizando loading');
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'calculada':
        return 'bg-blue-100 text-blue-800';
      case 'paga':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportarCSV = () => {
    const headers = ['OS', 'Cliente', 'Serviço', 'Data Entrega', 'Valor Serviço', 'Percentual', 'Comissão', 'Status'];
    const csvContent = [
      headers.join(','),
      ...comissoesFiltradas.map(c => [
        c.numero_os || 'N/A',
        c.cliente_nome || 'N/A',
        c.servico_nome || 'N/A',
        formatDate(c.data_entrega),
        c.valor_servico.toFixed(2),
        `${c.percentual_comissao}%`,
        c.valor_comissao.toFixed(2),
        c.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comissoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedArea area="dashboard">
        <MenuLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando comissões...</p>
            </div>
          </div>
        </MenuLayout>
      </ProtectedArea>
    );
  }

  return (
    <ProtectedArea area="dashboard">
      <MenuLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiDollarSign className="text-green-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Minhas Comissões</h1>
                <p className="text-gray-600">Relatório detalhado dos seus ganhos</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiFilter size={16} />
                Filtros
              </button>
              
              <button
                onClick={exportarCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiDownload size={16} />
                Exportar
              </button>
            </div>
          </div>

          {/* Filtros */}
          {mostrarFiltros && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                <button
                  onClick={() => setMostrarFiltros(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="CALCULADA">Calculada</option>
                    <option value="PAGA">Paga</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={filtros.tipoOrdem}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipoOrdem: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="SERVICO">Serviço</option>
                    <option value="RETORNO">Retorno</option>
                    <option value="GARANTIA">Garantia</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Comissões</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricas.totalComissao)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Média por OS</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricas.mediaComissao)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiCalendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total OSs</p>
                  <p className="text-2xl font-bold text-gray-900">{metricas.totalOSs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Serviços</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metricas.totalServicos)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Comissões */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico Detalhado ({comissoesFiltradas.length} registros)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Serviço
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comissoesFiltradas.map((comissao) => (
                    <tr key={comissao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{comissao.numero_os || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{comissao.cliente_nome}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {comissao.servico_nome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(comissao.valor_servico)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {comissao.percentual_comissao}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(comissao.valor_comissao)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comissao.status)}`}>
                          {comissao.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {formatDate(comissao.data_entrega)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {comissoesFiltradas.length === 0 && (
              <div className="text-center py-12">
                <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma comissão encontrada</h3>
                <p className="text-gray-500">
                  {comissoes.length === 0 
                    ? 'Você ainda não possui comissões registradas.'
                    : 'Tente ajustar os filtros para ver mais resultados.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </MenuLayout>
    </ProtectedArea>
  );
}
