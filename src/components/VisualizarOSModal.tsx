'use client';

import { FiX, FiPlayCircle, FiUser, FiPhone, FiCalendar, FiDollarSign, FiPackage, FiTool } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

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

interface VisualizarOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico | null;
  onIniciar: (id: string) => void;
}

export default function VisualizarOSModal({ isOpen, onClose, ordem, onIniciar }: VisualizarOSModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !ordem) return null;

  const aparelho = [ordem.categoria, ordem.marca, ordem.modelo, ordem.cor].filter(Boolean).join(' ');
  const entrada = ordem.created_at ? new Date(ordem.created_at).toLocaleDateString('pt-BR') : '';
  const valor = parseFloat(ordem.valor_servico || '0') + parseFloat(ordem.valor_peca || '0');
  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA': return 'bg-yellow-100 text-yellow-800';
      case 'EM_ANALISE': return 'bg-blue-100 text-blue-800';
      case 'AGUARDANDO_PECA': return 'bg-orange-100 text-orange-800';
      case 'CONCLUIDO': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ABERTA': return 'Aguardando Início';
      case 'EM_ANALISE': return 'Em Análise';
      case 'AGUARDANDO_PECA': return 'Aguardando Peça';
      case 'CONCLUIDO': return 'Reparo Concluído';
      default: return status;
    }
  };

  const handleIniciar = async () => {
    setLoading(true);
    try {
      console.log('Iniciando ordem no modal:', ordem.id);
      
      // Buscar status fixos para obter os nomes corretos
      const { data: statusFixos, error: statusError } = await supabase
        .from('status_fixo')
        .select('*')
        .eq('tipo', 'os');

      if (statusError) {
        console.error('Erro ao buscar status fixos:', statusError);
        alert('Erro ao buscar status. Tente novamente.');
        return;
      }

      console.log('Status fixos encontrados no modal:', statusFixos);

      // Encontrar o status "EM ANÁLISE" nos status fixos
      const statusEmAnalise = statusFixos?.find(s => s.nome === 'EM ANÁLISE');
      
      if (statusEmAnalise) {
        console.log('Status EM ANÁLISE encontrado no modal:', statusEmAnalise);
        
        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({ 
            status: statusEmAnalise.nome,
            status_tecnico: 'EM ANÁLISE'
          })
          .eq('id', ordem.id);

        if (updateError) {
          console.error('Erro ao atualizar status no modal:', updateError);
          alert('Erro ao iniciar a ordem. Tente novamente.');
          return;
        } else {
          console.log('Status atualizado com sucesso no modal');
          // Chamar a função onIniciar para redirecionar
          onIniciar(ordem.id);
          onClose();
        }
      } else {
        console.error('Status "EM ANÁLISE" não encontrado nos status fixos no modal');
        alert('Erro: Status "EM ANÁLISE" não encontrado. Verifique a configuração do sistema.');
        return;
      }
    } catch (error) {
      console.error('Erro ao iniciar ordem no modal:', error);
      alert('Erro ao iniciar a ordem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              #{ordem.numero_os || ordem.id} - {ordem.cliente?.nome || 'Cliente não informado'}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ordem.status)}`}>
              {getStatusLabel(ordem.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUser className="text-gray-500" size={16} />
              <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium">{ordem.cliente?.nome || 'Não informado'}</p>
              </div>
              {ordem.cliente?.telefone && (
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium flex items-center gap-1">
                    <FiPhone size={14} />
                    {ordem.cliente.telefone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Aparelho */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiPackage className="text-gray-500" size={16} />
              <h3 className="font-semibold text-gray-900">Aparelho</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Descrição</p>
                <p className="font-medium">{aparelho || 'Não informado'}</p>
              </div>
              {ordem.numero_serie && (
                <div>
                  <p className="text-sm text-gray-600">Número de Série</p>
                  <p className="font-medium">{ordem.numero_serie}</p>
                </div>
              )}
            </div>
          </div>

          {/* Serviços e Peças */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTool className="text-gray-500" size={16} />
              <h3 className="font-semibold text-gray-900">Serviços e Peças</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Serviço</p>
                <p className="font-medium">{ordem.servico || 'Não informado'}</p>
                {ordem.qtd_servico && (
                  <p className="text-xs text-gray-500">Qtd: {ordem.qtd_servico}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Peça</p>
                <p className="font-medium">{ordem.peca || 'Não informado'}</p>
                {ordem.qtd_peca && (
                  <p className="text-xs text-gray-500">Qtd: {ordem.qtd_peca}</p>
                )}
              </div>
            </div>
          </div>

          {/* Relato */}
          {ordem.relato && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Relato do Cliente</h3>
              <p className="text-gray-700">{ordem.relato}</p>
            </div>
          )}

          {/* Observações */}
          {ordem.observacao && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
              <p className="text-gray-700">{ordem.observacao}</p>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Data de Entrada</p>
                  <p className="font-medium">{entrada}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiDollarSign className="text-gray-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="font-medium text-blue-600">{valorFormatado}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
                                {ordem.status === 'ABERTA' && (
                        <button
                          onClick={handleIniciar}
                          disabled={loading}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Iniciando...
                            </>
                          ) : (
                            <>
                              <FiPlayCircle size={16} />
                              Iniciar OS
                            </>
                          )}
                        </button>
                      )}
        </div>
      </div>
    </div>
  );
} 