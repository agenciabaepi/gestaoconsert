"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiLock, FiUnlock, FiDownload, FiTrash2 } from 'react-icons/fi';

interface TurnoCaixa {
  id: string;
  data_abertura: string;
  data_fechamento: string | null;
  valor_abertura: number;
  valor_fechamento: number | null;
  valor_vendas: number;
  valor_sangrias: number;
  valor_suprimentos: number;
  valor_troco: number | null;
  status: 'aberto' | 'fechado';
  observacoes: string | null;
  usuario?: {
    nome: string;
  };
}

interface MovimentacaoCaixa {
  id: string;
  tipo: 'sangria' | 'suprimento' | 'venda';
  valor: number;
  descricao: string | null;
  data_movimentacao: string;
  usuario?: {
    nome: string;
  };
  venda_id?: string;
}

export default function MovimentacaoCaixaPage() {
  const { usuarioData } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [turnos, setTurnos] = useState<TurnoCaixa[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'abertura' | 'fechamento' | 'sangria' | 'suprimento' | 'venda'>('todos');

  useEffect(() => {
    if (usuarioData?.empresa_id) {
      carregarDados();
    }
  }, [usuarioData]);

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDados();
    }
  }, [dataInicio, dataFim]);

  const carregarDados = async () => {
    if (!usuarioData?.empresa_id) return;

    setLoading(true);
    try {
      // Buscar turnos
      const { data: turnosData } = await supabase
        .from('turnos_caixa')
        .select(`
          *,
          usuario:usuario_id(nome)
        `)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('data_abertura', { ascending: false });

      // Buscar movimentações
      const { data: movimentacoesData } = await supabase
        .from('movimentacoes_caixa')
        .select(`
          *,
          usuario:usuario_id(nome)
        `)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('data_movimentacao', { ascending: false });

      setTurnos(turnosData || []);
      setMovimentacoes(movimentacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    return status === 'aberto' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    return status === 'aberto' ? <FiUnlock className="w-4 h-4" /> : <FiLock className="w-4 h-4" />;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'sangria':
        return <FiTrendingDown className="w-4 h-4 text-red-600" />;
      case 'suprimento':
        return <FiTrendingUp className="w-4 h-4 text-blue-600" />;
      case 'venda':
        return <FiDollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <FiDollarSign className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'sangria':
        return 'text-red-600';
      case 'suprimento':
        return 'text-blue-600';
      case 'venda':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filtrarMovimentacoes = () => {
    let movimentacoesFiltradas = [...movimentacoes];

    // Filtrar por data
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => {
        const data = new Date(mov.data_movimentacao);
        return data >= inicio && data <= fim;
      });
    }

    // Filtrar por tipo
    if (filtroTipo !== 'todos') {
      movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => mov.tipo === filtroTipo);
    }

    return movimentacoesFiltradas;
  };

  const calcularTotais = () => {
    const movimentacoesFiltradas = filtrarMovimentacoes();
    
    return {
      vendas: movimentacoesFiltradas.filter(m => m.tipo === 'venda').reduce((sum, m) => sum + m.valor, 0),
      sangrias: movimentacoesFiltradas.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0),
      suprimentos: movimentacoesFiltradas.filter(m => m.tipo === 'suprimento').reduce((sum, m) => sum + m.valor, 0),
    };
  };

  const exportarRelatorio = () => {
    const movimentacoesFiltradas = filtrarMovimentacoes();
    const totais = calcularTotais();
    
    let csv = 'Data,Tipo,Valor,Descrição,Usuário\n';
    
    movimentacoesFiltradas.forEach(mov => {
      csv += `${formatDate(mov.data_movimentacao)},${mov.tipo},${mov.valor},${mov.descricao || ''},${mov.usuario?.nome || ''}\n`;
    });
    
    csv += `\nTotais:\n`;
    csv += `Vendas,${totais.vendas}\n`;
    csv += `Sangrias,${totais.sangrias}\n`;
    csv += `Suprimentos,${totais.suprimentos}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimentacao-caixa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totais = calcularTotais();

  // Verificar se o usuário é admin
  const isAdmin = usuarioData?.nivel === 'admin';

  // Função para excluir sangria
  const excluirSangria = async (movimentacaoId: string) => {
    if (!isAdmin) {
      addToast('error', 'Apenas administradores podem excluir sangrias.');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir esta sangria? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('movimentacoes_caixa')
        .delete()
        .eq('id', movimentacaoId)
        .eq('tipo', 'sangria');

      if (error) {
        console.error('Erro ao excluir sangria:', error);
        addToast('error', 'Erro ao excluir sangria. Tente novamente.');
        return;
      }

      // Recarregar dados
      await carregarDados();
      addToast('success', 'Sangria excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir sangria:', error);
      addToast('error', 'Erro ao excluir sangria. Tente novamente.');
    }
  };

  return (
    <ProtectedArea area="financeiro">
      <MenuLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Movimentação de Caixa</h1>
            <p className="text-gray-600">Acompanhe todas as movimentações e turnos do caixa</p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'abertura' | 'fechamento' | 'sangria' | 'suprimento' | 'venda')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="venda">Vendas</option>
                  <option value="sangria">Sangrias</option>
                  <option value="suprimento">Suprimentos</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={exportarRelatorio} className="w-full">
                  <FiDownload className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Vendas</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totais.vendas)}</p>
                </div>
                <FiDollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Total Sangrias</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(totais.sangrias)}</p>
                </div>
                <FiTrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Suprimentos</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totais.suprimentos)}</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Turnos */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Turnos de Caixa</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abertura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Troco</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {turnos.map((turno) => (
                    <tr key={turno.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatDate(turno.data_abertura)}</div>
                          {turno.data_fechamento && (
                            <div className="text-gray-500">até {formatDate(turno.data_fechamento)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {turno.usuario?.nome || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(turno.valor_abertura)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {turno.valor_fechamento ? formatCurrency(turno.valor_fechamento) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatCurrency(turno.valor_vendas)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                        {turno.valor_troco ? formatCurrency(turno.valor_troco) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(turno.status)}`}>
                          {getStatusIcon(turno.status)}
                          <span className="ml-1">{turno.status === 'aberto' ? 'Aberto' : 'Fechado'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Movimentações */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Movimentações Detalhadas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrarMovimentacoes().map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(mov.data_movimentacao)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(mov.tipo)}`}>
                          {getTipoIcon(mov.tipo)}
                          <span className="ml-1 capitalize">{mov.tipo}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(mov.valor)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {mov.descricao || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mov.usuario?.nome || 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mov.tipo === 'sangria' && (
                            <button
                              onClick={() => excluirSangria(mov.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Excluir sangria"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Carregando dados...</div>
            </div>
          )}
        </div>
      </MenuLayout>
    </ProtectedArea>
  );
}