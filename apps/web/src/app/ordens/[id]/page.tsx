'use client';

import React, { useEffect, useState } from 'react';
import MenuLayout from '@/components/MenuLayout';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FiArrowLeft, FiEdit, FiPrinter, FiDollarSign, FiMessageCircle, FiUser, FiSmartphone, FiFileText, FiCalendar, FiShield, FiTool, FiPackage, FiCheckCircle, FiClock, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import ImagensOS from '@/components/ImagensOS';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useStatusHistorico } from '@/hooks/useStatusHistorico';
import StatusHistoricoTimeline from '@/components/StatusHistoricoTimeline';

const VisualizarOrdemServicoPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const { addToast } = useToast();
  const { empresaData } = useAuth();
  const { historico, loading: loadingHistorico } = useStatusHistorico(id as string);
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para sistema de entrega
  const [modalEntrega, setModalEntrega] = useState(false);
  const [termoGarantiaSelecionado, setTermoGarantiaSelecionado] = useState<any>(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [processandoEntrega, setProcessandoEntrega] = useState(false);
  const [termosGarantia, setTermosGarantia] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrdem = async () => {
      setLoading(true);
      try {
        // Na consulta do banco (linha 23), adicionar o campo prazo_entrega:
        const { data, error } = await supabase
          .from('ordens_servico')
          .select(`
            id,
            numero_os,
            empresa_id,
            cliente_id,
            created_at,
            prazo_entrega,
            data_entrega,
            cliente:cliente_id (
              nome,
              telefone,
              cpf,
              endereco
            ),
            tecnico:tecnico_id (
              nome
            ),
            categoria,
            modelo,
            cor,
            marca,
            numero_serie,
            status,
            status_tecnico,
            observacao,
            qtd_peca,
            peca,
            valor_peca,
            qtd_servico,
            servico,
            valor_servico,
            valor_faturado,
            desconto,
            acessorios,
            condicoes_equipamento,
            problema_relatado,
            laudo,
            vencimento_garantia,
            termo_garantia_id,
            tipo,
            imagens,
            termo_garantia:termo_garantia_id (
              id,
              nome,
              conteudo
            )
          `)
          .eq('id', String(id))
          .single();

        if (error) {
          console.error('Erro ao carregar OS:', error);
          console.error('Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          // Mapear campos para compatibilidade com a interface
          const ordemMapeada = {
            ...data,
            relato: data.problema_relatado, // Mapear problema_relatado para relato
            observacao: data.observacao // Manter observacao como está
          };
          
          setOrdem(ordemMapeada);
        }
      } catch (error) {
        console.error('Erro ao carregar OS:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrdem();
  }, [id]);

  useEffect(() => {
    fetchTermosGarantia();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'orcamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isRetorno = (ordem: any) => {
    const tipo = ordem?.tipo?.toLowerCase();
    return tipo === 'retorno' || tipo === 'Retorno';
  };

  const fetchTermosGarantia = async () => {
    try {
      const { data, error } = await supabase
        .from('termos_garantia')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao carregar termos de garantia:', error);
        return;
      }
      
      setTermosGarantia(data || []);
    } catch (error) {
      console.error('Erro ao carregar termos de garantia:', error);
    }
  };

  // Função para processar entrega da O.S.
  const processarEntrega = async () => {
    if (!termoGarantiaSelecionado) {
      addToast('error', 'Selecione um termo de garantia');
      return;
    }

    if (!formaPagamento) {
      addToast('error', 'Selecione a forma de pagamento');
      return;
    }

    const valorOS = calcularValores().valorFinal;
    const valorRecebidoNum = parseFloat(valorRecebido.replace(',', '.'));

    if (isNaN(valorRecebidoNum) || valorRecebidoNum < valorOS) {
      addToast('error', `Valor recebido deve ser pelo menos R$ ${valorOS.toFixed(2)}`);
      return;
    }

    setProcessandoEntrega(true);

    try {
      // 1. Atualizar O.S. para ENTREGUE
      const { error: updateError } = await supabase
        .from('ordens_servico')
        .update({
          status: 'ENTREGUE',
          status_tecnico: 'FINALIZADA',
          termo_garantia_id: termoGarantiaSelecionado.id,
          data_entrega: new Date().toISOString().split('T')[0],
          vencimento_garantia: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .eq('id', id);

      if (updateError) {
        addToast('error', 'Erro ao atualizar O.S.: ' + updateError.message);
        return;
      }

      // 2. Se houver valor, criar venda
      if (valorOS > 0) {
        const numeroVenda = await criarVenda();
        if (!numeroVenda) {
          addToast('error', 'Erro ao criar venda');
          return;
        }
        addToast('success', `✅ Venda #${numeroVenda} criada com sucesso!`);
      }

      addToast('success', '✅ O.S. entregue com sucesso!');
      setModalEntrega(false);
      router.push('/ordens');

    } catch (error) {
      console.error('Erro ao processar entrega:', error);
      addToast('error', 'Erro inesperado ao processar entrega');
    } finally {
      setProcessandoEntrega(false);
    }
  };

  // Função para criar venda
  const criarVenda = async () => {
    try {
      const valores = calcularValores();
      
      // Buscar próximo número de venda
      const { data: ultimaVenda, error: errorUltimaVenda } = await supabase
        .from('vendas')
        .select('numero_venda')
        .eq('empresa_id', empresaData?.id)
        .order('numero_venda', { ascending: false })
        .limit(1)
        .single();

      if (errorUltimaVenda && errorUltimaVenda.code !== 'PGRST116') {
        console.error('Erro ao buscar última venda:', errorUltimaVenda);
        return null;
      }

      const proximoNumero = (ultimaVenda?.numero_venda || 0) + 1;
      // Criar venda
      const payload = {
        numero_venda: proximoNumero,
        data_venda: new Date().toISOString(),
        cliente_id: ordem?.cliente_id,
        total: valores.valorFinal,
        forma_pagamento: formaPagamento,
        status: 'finalizada',
        desconto: 0,
        acrescimo: 0,
        tipo_pedido: 'Ordem de Serviço',
        observacoes: `O.S. #${ordem?.numero_os} - ${ordem?.clientes?.nome}`,
        produtos: [], // Campo obrigatório para vendas
        usuario_id: null, // Campo obrigatório para vendas
        empresa_id: ordem?.empresa_id || '550e8400-e29b-41d4-a716-446655440001' // Campo obrigatório para vendas
      };

      // Tentar inserir sem select primeiro para ver se há erro na inserção
      const { error: insertError } = await supabase
        .from('vendas')
        .insert([payload]);

      if (insertError) {
        console.error('Erro detalhado ao criar venda:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: insertError
        });
        return null;
      }

      // Se inserção funcionou, buscar a venda criada
      const { data: vendaCriada, error: selectError } = await supabase
        .from('vendas')
        .select('*')
        .eq('numero_venda', proximoNumero)
        .eq('empresa_id', empresaData?.id)
        .single();

      if (selectError) {
        console.error('Erro ao buscar venda criada:', selectError);
        // Mesmo com erro na busca, a venda foi criada
        return proximoNumero;
      }

      return proximoNumero;

    } catch (error) {
      console.error('Erro inesperado ao criar venda:', error);
      return null;
    }
  };

  // Calcular valores
  const calcularValores = () => {
    if (!ordem) return { valorTotal: 0, valorFinal: 0 };
    
    // Converter para números e garantir valores válidos
    const valorServico = Number(ordem.valor_servico || 0);
    const qtdServico = Number(ordem.qtd_servico || 1);
    const valorPeca = Number(ordem.valor_peca || 0);
    const qtdPeca = Number(ordem.qtd_peca || 1);
    const desconto = Number(ordem.desconto || 0);
    
    const totalServico = valorServico * qtdServico;
    const totalPeca = valorPeca * qtdPeca;
    const valorTotal = totalServico + totalPeca;
    const valorFinal = valorTotal - desconto;
    
    return { valorTotal, valorFinal };
  };

  if (loading) {
    return (
      <MenuLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ordem de serviço...</p>
          </div>
        </div>
      </MenuLayout>
    );
  }

  if (!ordem) {
    return (
      <MenuLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ordem não encontrada</h2>
            <p className="text-gray-600 mb-4">A ordem de serviço solicitada não foi encontrada.</p>
            <button
              onClick={() => router.push('/ordens')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Voltar para Ordens
            </button>
          </div>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/ordens')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
                             <div>
                 <div className="flex items-center gap-3">
                   <h1 className="text-3xl font-bold text-gray-900">
                     OS #{ordem.numero_os}
                   </h1>
                   {isRetorno(ordem) && (
                     <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                       <span className="text-sm font-medium text-red-700">Retorno</span>
                     </div>
                   )}
                 </div>
                 <p className="text-gray-600 mt-1">
                   Criada em {formatDate(ordem.created_at)}
                 </p>
               </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/ordens/${id}/editar`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => window.open(`/ordens/${id}/imprimir`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiPrinter className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => window.open(`/os/${ordem?.id}/status`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiExternalLink className="w-4 h-4" />
                Ver Status Público
              </button>
              {calcularValores().valorFinal > 0 && ordem.status !== 'ENTREGUE' && (
                <button
                  onClick={() => setModalEntrega(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiPackage className="w-4 h-4" />
                  Entregar O.S.
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ordem.status)}`}>
                <FiCheckCircle className="w-4 h-4 mr-2" />
                {ordem.status || 'Status não definido'}
              </span>
              {ordem.status_tecnico && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <FiTool className="w-4 h-4 mr-2" />
                  {ordem.status_tecnico}
                </span>
              )}
              {isRetorno(ordem) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Retorno
                </span>
              )}
            </div>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Coluna Esquerda - Informações Principais */}
             <div className="lg:col-span-2 space-y-6">
               {/* Cliente */}
               <div className={`bg-white rounded-xl shadow-sm border p-6 ${
                 isRetorno(ordem)
                   ? 'border-red-200 bg-red-50/30' 
                   : 'border-gray-200'
               }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Cliente</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-medium text-gray-900">{ordem.cliente?.nome || 'Nome não informado'}</p>
                  </div>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-600">Telefone:</span>
                      <p className="font-medium text-gray-900">{ordem.cliente?.telefone || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aparelho */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiSmartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Aparelho</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Categoria:</span>
                    <p className="font-medium text-gray-900">{ordem.categoria || '---'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Marca:</span>
                    <p className="font-medium text-gray-900">{ordem.marca || '---'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Modelo:</span>
                    <p className="font-medium text-gray-900">{ordem.modelo || '---'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cor:</span>
                    <p className="font-medium text-gray-900">{ordem.cor || '---'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Número de Série:</span>
                    <p className="font-medium text-gray-900">{ordem.numero_serie || '---'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Acessórios:</span>
                    <p className="font-medium text-gray-900">{ordem.acessorios || '---'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Condições do Equipamento:</span>
                    <p className="font-medium text-gray-900">{ordem.condicoes_equipamento || '---'}</p>
                  </div>
                </div>
              </div>

              {/* Relato e Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiMessageCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Relato do Cliente</h2>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ordem.relato || 'Nenhum relato registrado.'}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FiFileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Observações</h2>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ordem.observacao || 'Nenhuma observação registrada.'}
                  </p>
                </div>
              </div>

                             {/* Laudo Técnico */}
               {ordem.laudo && (
                 <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-blue-100 rounded-lg">
                       <FiTool className="w-5 h-5 text-blue-600" />
                     </div>
                     <h2 className="text-xl font-semibold text-gray-900">Laudo Técnico</h2>
                   </div>
                   <p className="text-gray-700 whitespace-pre-line">{ordem.laudo}</p>
                 </div>
               )}

               {/* Informações do Retorno */}
               {isRetorno(ordem) && (
                 <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-red-100 rounded-lg">
                       <FiRefreshCw className="w-5 h-5 text-red-600" />
                     </div>
                     <h2 className="text-xl font-semibold text-red-900">Informações do Retorno</h2>
                   </div>
                   <div className="space-y-3 text-sm">
                     <div className="bg-white rounded-lg p-4 border border-red-200">
                       <p className="text-red-800 font-medium mb-2">⚠️ Esta é uma ordem de retorno</p>
                       <p className="text-red-700">
                         O equipamento foi devolvido pelo cliente para correção ou ajuste. 
                         Verifique o relato do cliente e o laudo técnico para entender o motivo do retorno.
                       </p>
                     </div>
                     {ordem.relato && (
                       <div>
                         <span className="text-red-700 font-medium">Motivo do retorno:</span>
                         <p className="text-red-700 mt-1 whitespace-pre-line">{ordem.relato}</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}
            </div>

            {/* Coluna Direita - Valores e Informações Técnicas */}
            <div className="space-y-6">
              {/* Informações da OS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiFileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Informações da OS</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Técnico:</span>
                    <span className="font-medium text-gray-900">{ordem.tecnico?.nome || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Garantia:</span>
                    <span className="font-medium text-gray-900">{ordem.termo_garantia?.nome || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venc. Garantia:</span>
                    <span className="font-medium text-gray-900">{formatDate(ordem.vencimento_garantia)}</span>
                  </div>
                </div>
              </div>

              {/* Datas Importantes - Versão Compacta */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Prazos</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Prazo de Entrega */}
                  <div>
                    <span className="text-gray-600 block mb-1">Prazo:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {ordem.prazo_entrega ? formatDate(ordem.prazo_entrega) : 'Não definido'}
                      </span>
                      {ordem.prazo_entrega && !ordem.data_entrega && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          new Date(ordem.prazo_entrega) < new Date()
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {new Date(ordem.prazo_entrega) < new Date() ? 'Vencido' : 'No prazo'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Data de Retirada */}
                  <div>
                    <span className="text-gray-600 block mb-1">Retirada:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {ordem.data_entrega ? formatDate(ordem.data_entrega) : 'Aguardando'}
                      </span>
                      {ordem.data_entrega && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          Entregue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Valores</h2>
                </div>
                
                {/* Serviços */}
                {ordem.servico && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Serviços</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span>{ordem.servico}</span>
                        <span className="font-medium">{formatCurrency(ordem.valor_servico)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Qtd: {ordem.qtd_servico || 1}</span>
                        <span>Subtotal: {formatCurrency((ordem.valor_servico || 0) * (ordem.qtd_servico || 1))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Peças */}
                {ordem.peca && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Peças</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span>{ordem.peca}</span>
                        <span className="font-medium">{formatCurrency(ordem.valor_peca)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Qtd: {ordem.qtd_peca || 1}</span>
                        <span>Subtotal: {formatCurrency((ordem.valor_peca || 0) * (ordem.qtd_peca || 1))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumo dos Valores */}
                {(ordem.servico || ordem.peca) && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo</h3>
                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                      {ordem.servico && (
                        <div className="flex justify-between text-sm">
                          <span>Serviços:</span>
                          <span className="font-medium">{formatCurrency(Number(ordem.valor_servico || 0) * Number(ordem.qtd_servico || 1))}</span>
                        </div>
                      )}
                      {ordem.peca && (
                        <div className="flex justify-between text-sm">
                          <span>Peças:</span>
                          <span className="font-medium">{formatCurrency(Number(ordem.valor_peca || 0) * Number(ordem.qtd_peca || 1))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resumo Final */}
                {(() => {
                  const { valorTotal, valorFinal } = calcularValores();
                  return (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatCurrency(valorTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Desconto:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(ordem.desconto || 0)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(valorFinal)}</span>
                      </div>
                      {ordem.valor_faturado && Math.abs(ordem.valor_faturado - valorFinal) > 0.01 && (
                        <div className="flex justify-between text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                          <span>Faturado:</span>
                          <span className="font-medium">{formatCurrency(ordem.valor_faturado)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Garantia */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FiShield className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Garantia</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Termo:</span>
                    <p className="font-medium text-gray-900">{ordem.termo_garantia?.nome || 'Nenhum termo selecionado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <p className="font-medium text-gray-900">{formatDate(ordem.vencimento_garantia)}</p>
                  </div>
                  {ordem.vencimento_garantia && (
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {new Date(ordem.vencimento_garantia) > new Date() ? 'Garantia válida' : 'Garantia expirada'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Imagens do Equipamento */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <ImagensOS 
                  imagens={ordem.imagens || ''} 
                  ordemId={ordem.numero_os || ordem.id} 
                />
              </div>

              {/* Histórico de Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <FiClock className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Histórico de Status</h2>
                </div>
                <div className="max-h-80 overflow-y-auto pr-1">
                  <StatusHistoricoTimeline 
                    historico={historico} 
                    loading={loadingHistorico}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Entrega */}
          {modalEntrega && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiPackage className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Entregar O.S.</h3>
                </div>

                <div className="space-y-4">
                  {/* Termo de Garantia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Termo de Garantia *
                    </label>
                    <select
                      value={termoGarantiaSelecionado?.id || ''}
                      onChange={(e) => {
                        const termo = termosGarantia.find(t => t.id === e.target.value);
                        setTermoGarantiaSelecionado(termo || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um termo...</option>
                      {termosGarantia.map((termo) => (
                        <option key={termo.id} value={termo.id}>
                          {termo.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento *
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>

                  {/* Valor Recebido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Recebido *
                    </label>
                    <input
                      type="text"
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      placeholder={`Mínimo: R$ ${calcularValores().valorFinal.toFixed(2)}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor da O.S.: R$ {calcularValores().valorFinal.toFixed(2)}
                    </p>
                  </div>

                  {/* Resumo */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Resumo da Entrega</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span className="font-medium">{ordem?.clientes?.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>O.S.:</span>
                        <span className="font-medium">#{ordem?.numero_os}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium text-green-600">
                          R$ {calcularValores().valorFinal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setModalEntrega(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processarEntrega}
                    disabled={processandoEntrega || !termoGarantiaSelecionado || !formaPagamento || !valorRecebido}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processandoEntrega ? 'Processando...' : 'Confirmar Entrega'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </MenuLayout>
  );
};

export default VisualizarOrdemServicoPage;
