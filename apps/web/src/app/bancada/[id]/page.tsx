'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FiClipboard, FiSave, FiBox, FiTool, FiPlayCircle, FiX, FiCamera, FiTrash2, FiEdit, FiCheck, FiAlertCircle } from 'react-icons/fi';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
import ProdutoServicoSearch from '@/components/ProdutoServicoSearch';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

export default function DetalheBancadaPage() {
  const params = useParams();
  const id = params?.id as string;
  const { addToast, showModal } = useToast();
  const confirm = useConfirm();
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
    };
    [key: string]: unknown;
  }
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusTecnico, setStatusTecnico] = useState('');
  const [laudo, setLaudo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [produtos, setProdutos] = useState<string>('');
  const [servicos, setServicos] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [statusTecnicoOptions, setStatusTecnicoOptions] = useState<{ id: string, nome: string }[]>([]);
  const [mostrarBotaoIniciar, setMostrarBotaoIniciar] = useState(false);
  
  // Estados para produtos e serviços selecionados
  const [produtosSelecionados, setProdutosSelecionados] = useState<Array<{
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
  }>>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<Array<{
    id: string;
    nome: string;
    preco: number;
  }>>([]);
  const [empresaId, setEmpresaId] = useState<string>('');
  
  // Estados para upload de imagens
  const [imagens, setImagens] = useState<File[]>([]);
  const [previewImagens, setPreviewImagens] = useState<string[]>([]);
  const [imagensExistentes, setImagensExistentes] = useState<string[]>([]);
  const [uploadingImagens, setUploadingImagens] = useState(false);

  useEffect(() => {
    const fetchOS = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`*, cliente:cliente_id(nome)`)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Erro ao carregar OS:', error);
        setLoading(false);
        return;
      }
      
      if (!data) {
        console.error('OS não encontrada com ID:', id);
        setLoading(false);
        return;
      }
      
      if (data) {
        setOs(data);
        setEmpresaId(data.empresa_id);
        
        // Carregar imagens existentes
        if (data.imagens) {
          const urls = data.imagens.split(',').filter((url: string) => url.trim() !== '');
          setImagensExistentes(urls);
        }
        
        // Definir status inicial baseado no status atual da OS
        let statusInicial = data.status_tecnico || '';
        
        if (!statusInicial) {
          // Se não há status técnico definido, usar o status da OS
          switch (data.status) {
            case 'ABERTA':
              statusInicial = 'AGUARDANDO INÍCIO';
              break;
            case 'EM_ANALISE':
              statusInicial = 'EM ANÁLISE';
              break;
            case 'AGUARDANDO_PECA':
              statusInicial = 'AGUARDANDO PEÇA';
              break;
            case 'CONCLUIDO':
              statusInicial = 'REPARO CONCLUÍDO';
              break;
            default:
              statusInicial = 'AGUARDANDO INÍCIO';
          }
        }
        
        setStatusTecnico(statusInicial);
        setLaudo(data.laudo || '');
        setObservacoes(data.observacao || '');
        setProdutos(data.peca || '');
        setServicos(data.servico || '');
        
        // Exibir no console para debug
        // Tentar restaurar produtos e serviços selecionados (campos novos podem não existir ainda)
        try {
          // Buscar campos JSON separadamente para não quebrar se não existirem
          const { data: dadosJson } = await supabase
            .from('ordens_servico')
            .select('produtos_json, servicos_json')
            .eq('id', id)
            .single();
            
          if (dadosJson?.produtos_json) {
            const produtosRestaurados = JSON.parse(dadosJson.produtos_json);
            setProdutosSelecionados(produtosRestaurados);
          } else {
            setProdutosSelecionados([]);
          }
          
          if (dadosJson?.servicos_json) {
            const servicosRestaurados = JSON.parse(dadosJson.servicos_json);
            setServicosSelecionados(servicosRestaurados);
          } else {
            setServicosSelecionados([]);
          }
        } catch (error) {
          // Tentar reconstruir produtos e serviços a partir dos campos de texto
          const produtosReconstruidos = [];
          const servicosReconstruidos = [];
          
          // Se há valor de peça, criar item genérico baseado no texto
          if (data.peca && data.valor_peca && parseFloat(data.valor_peca) > 0) {
            produtosReconstruidos.push({
              id: 'reconstruct-prod-1',
              nome: data.peca.length > 50 ? data.peca.substring(0, 50) + '...' : data.peca,
              preco: parseFloat(data.valor_peca),
              quantidade: 1,
              tipo: 'produto'
            });
          }
          
          // Se há valor de serviço, criar item genérico baseado no texto
          if (data.servico && data.valor_servico && parseFloat(data.valor_servico) > 0) {
            servicosReconstruidos.push({
              id: 'reconstruct-serv-1',
              nome: data.servico.length > 50 ? data.servico.substring(0, 50) + '...' : data.servico,
              preco: parseFloat(data.valor_servico),
              tipo: 'servico'
            });
          }
          
          setProdutosSelecionados(produtosReconstruidos);
          setServicosSelecionados(servicosReconstruidos);
        }
        
        // Mostrar botão iniciar se estiver aguardando início
        setMostrarBotaoIniciar(statusInicial === 'AGUARDANDO INÍCIO');
      }
      setLoading(false);
    };
    if (id) fetchOS();
  }, [id]);

  useEffect(() => {
    async function fetchStatusTecnico() {
      // Status padrão do técnico
      const statusPadrao = [
        { id: '1', nome: 'AGUARDANDO INÍCIO' },
        { id: '2', nome: 'EM ANÁLISE' },
        { id: '3', nome: 'ORÇAMENTO ENVIADO' },
        { id: '4', nome: 'AGUARDANDO PEÇA' },
        { id: '5', nome: 'EM EXECUÇÃO' },
        { id: '6', nome: 'SEM REPARO' },
        { id: '7', nome: 'REPARO CONCLUÍDO' }
      ];
      
      // Buscar status técnicos personalizados da empresa
      const { data: statusEmpresa } = await supabase
        .from('status')
        .select('id, nome')
        .eq('tipo', 'tecnico');
      
      // Buscar status técnicos fixos do sistema
      const { data: statusFixos } = await supabase
        .from('status_fixo')
        .select('id, nome')
        .eq('tipo', 'tecnico');
      
      // Combinar todos os status
      const todosStatus = [
        ...statusPadrao,
        ...(statusFixos || []),
        ...(statusEmpresa || [])
      ];
      
      setStatusTecnicoOptions(todosStatus);
    }
    fetchStatusTecnico();
  }, []);

  const handleSalvar = async () => {
    setSalvando(true);
    
    try {
      // Upload de imagens primeiro
      const novasImagens = await uploadImagens();
      
      // Atualizar status da OS baseado no status técnico
      let novoStatus = os?.status;
      if (statusTecnico === 'EM ANÁLISE') {
        novoStatus = 'EM_ANALISE';
      } else if (statusTecnico === 'AGUARDANDO PEÇA') {
        novoStatus = 'AGUARDANDO_PECA';
      } else if (statusTecnico === 'REPARO CONCLUÍDO') {
        novoStatus = 'CONCLUIDO';
      } else if (statusTecnico === 'AGUARDANDO INÍCIO') {
        novoStatus = 'ABERTA';
      }

      // Preparar dados dos produtos e serviços
      const produtosText = produtosSelecionados.map(p => 
        `${p.nome} (${p.quantidade}x) - ${formatPrice(p.preco * p.quantidade)}`
      ).join(', ');
      
      const servicosText = servicosSelecionados.map(s => 
        `${s.nome} - ${formatPrice(s.preco)}`
      ).join(', ');
      
      const totalProdutos = calcularTotalProdutos();
      const totalServicos = calcularTotalServicos();
      // Combinar imagens existentes com novas
      const todasImagens = [...imagensExistentes, ...novasImagens];
      const imagensString = todasImagens.join(',');

      // Preparar dados estruturados para salvar
      const produtosJson = JSON.stringify(produtosSelecionados);
      const servicosJson = JSON.stringify(servicosSelecionados);
      
      // Tentar salvar com campos JSON, mas funcionar mesmo se eles não existirem
      const updateData: any = {
        status: novoStatus,
        status_tecnico: statusTecnico,
        laudo,
        observacao: observacoes,
        peca: produtosText || produtos,
        servico: servicosText || servicos,
        valor_peca: calcularTotalProdutos().toString(),
        valor_servico: calcularTotalServicos().toString(),
        valor_faturado: (calcularTotalProdutos() + calcularTotalServicos()).toString(),
        imagens: imagensString
      };
      
      // Tentar adicionar campos JSON se existirem
      try {
        await supabase
          .from('ordens_servico')
          .update({ produtos_json: produtosJson, servicos_json: servicosJson })
          .eq('id', id);
        } catch (jsonError) {
        }
      
      const { error } = await supabase
        .from('ordens_servico')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      if (os) {
        setOs({ 
          ...os, 
          status: novoStatus || os.status,
          valor_peca: calcularTotalProdutos().toString(),
          valor_servico: calcularTotalServicos().toString(),
          valor_faturado: (calcularTotalProdutos() + calcularTotalServicos()).toString(),
          imagens: imagensString
        });
      }

      // Limpar imagens temporárias
      setImagens([]);
      setPreviewImagens([]);
      setImagensExistentes(todasImagens);

      // Atualizar botão iniciar
      setMostrarBotaoIniciar(statusTecnico === 'AGUARDANDO INÍCIO');

      // Mostrar toast de sucesso
      addToast('success', 'Dados salvos com sucesso!');
      // Se enviou orçamento, emite notificação backend
      try {
        if (statusTecnico === 'ORÇAMENTO ENVIADO' && empresaId && id) {
          await fetch('/api/notificacoes/emitir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              empresa_id: empresaId,
              tipo: 'orcamento_enviado',
              os_id: id,
              mensagem: `OS #${os?.numero_os || ''} - orçamento enviado pelo técnico.`
            })
          });
        }
        
        // Se concluiu o reparo, emite notificação mais simples
        if (statusTecnico === 'REPARO CONCLUÍDO' && empresaId && id) {
          try {
            const response = await fetch('/api/notificacoes/emitir', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                empresa_id: empresaId,
                tipo: 'reparo_concluido',
                os_id: id,
                mensagem: `OS #${os?.numero_os || ''} - reparo concluído pelo técnico.`
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              } else {
              console.error('Erro ao enviar notificação:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Erro ao emitir notificação de reparo concluído:', error);
          }
        }
      } catch (e) {
        console.warn('Falha ao emitir notificação:', e);
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      addToast('error', 'Erro ao salvar: ' + (error as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const handleIniciarOS = async () => {
    setSalvando(true);
    
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          status: 'EM_ANALISE',
          status_tecnico: 'EM ANÁLISE'
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setStatusTecnico('EM ANÁLISE');
      setMostrarBotaoIniciar(false);
      
      if (os) {
        setOs({ ...os, status: 'EM_ANALISE', status_tecnico: 'EM ANÁLISE' });
      }

      addToast('success', 'OS iniciada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao iniciar OS:', error);
      addToast('error', 'Erro ao iniciar OS: ' + (error as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  // Funções para adicionar produtos e serviços
  const handleAdicionarProduto = (produto: { id: string; nome: string; preco: number; tipo: string }) => {
    const produtoExistente = produtosSelecionados.find(p => p.id === produto.id);
    
    if (produtoExistente) {
      setProdutosSelecionados(prev => {
        const updated = prev.map(p => 
          p.id === produto.id 
            ? { ...p, quantidade: p.quantidade + 1 }
            : p
        );
        return updated;
      });
    } else {
      setProdutosSelecionados(prev => {
        const updated = [...prev, { ...produto, quantidade: 1 }];
        return updated;
      });
    }
  };

  const handleAdicionarServico = (servico: { id: string; nome: string; preco: number; tipo: string }) => {
    const servicoExistente = servicosSelecionados.find(s => s.id === servico.id);
    
    if (!servicoExistente) {
      setServicosSelecionados(prev => {
        const updated = [...prev, servico];
        return updated;
      });
    } else {
      }
  };

  const handleRemoverProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => prev.filter(p => p.id !== produtoId));
  };

  const handleRemoverServico = (servicoId: string) => {
    setServicosSelecionados(prev => prev.filter(s => s.id !== servicoId));
  };
  
  const handleEditarProduto = (produtoId: string, novoNome: string, novoPreco: number, novaQuantidade: number) => {
    setProdutosSelecionados(prev => 
      prev.map(p => 
        p.id === produtoId 
          ? { ...p, nome: novoNome, preco: novoPreco, quantidade: novaQuantidade }
          : p
      )
    );
  };
  
  const handleEditarServico = (servicoId: string, novoNome: string, novoPreco: number) => {
    setServicosSelecionados(prev => 
      prev.map(s => 
        s.id === servicoId 
          ? { ...s, nome: novoNome, preco: novoPreco }
          : s
      )
    );
  };

  const handleAlterarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(produtoId);
      return;
    }
    
    setProdutosSelecionados(prev => 
      prev.map(p => 
        p.id === produtoId 
          ? { ...p, quantidade: novaQuantidade }
          : p
      )
    );
  };

  const calcularTotalProdutos = () => {
    let totalSelecionados = produtosSelecionados.reduce((total, produto) => {
      return total + (produto.preco * produto.quantidade);
    }, 0);
    
    // Se não há produtos selecionados, mas há valor existente na OS, usar o existente
    if (totalSelecionados === 0 && os && os.valor_peca) {
      totalSelecionados = parseFloat(os.valor_peca) || 0;
    }
    
    return totalSelecionados;
  };

  const calcularTotalServicos = () => {
    let totalSelecionados = servicosSelecionados.reduce((total, servico) => {
      return total + servico.preco;
    }, 0);
    
    // Se não há serviços selecionados, mas há valor existente na OS, usar o existente
    if (totalSelecionados === 0 && os && os.valor_servico) {
      totalSelecionados = parseFloat(os.valor_servico) || 0;
    }
    
    return totalSelecionados;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Funções para manipular imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      addToast('warning', 'Algumas imagens foram ignoradas. Apenas imagens até 5MB são permitidas.');
    }
    
    setImagens(prev => [...prev, ...validFiles]);
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImagens(prev => [...prev, ...previews]);
  };

  const handleRemoveImage = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
    setPreviewImagens(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setImagensExistentes(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagens = async () => {
    if (imagens.length === 0) return [];
    
    setUploadingImagens(true);
    const uploadedUrls: string[] = [];
    
    try {
      const formData = new FormData();
      formData.append('ordemId', id);
      
      imagens.forEach((file) => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        console.error('Erro no upload das imagens:', uploadResult.error);
        addToast('error', 'Erro ao fazer upload das imagens: ' + uploadResult.error);
        return [];
      }

      uploadedUrls.push(...uploadResult.files.map((file: any) => file.url));
      
    } catch (error) {
      console.error('Erro no upload das imagens:', error);
      addToast('error', 'Erro inesperado no upload das imagens');
    } finally {
      setUploadingImagens(false);
    }
    
    return uploadedUrls;
  };

  // const steps = [
  //   { label: 'Orçamento', icon: <FiFileText /> },
  //   { label: 'Aberto', icon: <FiPlay /> },
  //   { label: 'Andamento', icon: <FiTool /> },
  //   { label: 'Concluído', icon: <FiCheck /> },
  //   { label: 'Faturado', icon: <FiDollarSign /> },
  //   { label: 'Finalizado', icon: <FiFlag /> }
  // ];

  if (loading) {
    return (
      <MenuLayout>
        <div className="px-10 py-8 max-w-7xl mx-auto text-center text-gray-500">Carregando OS...</div>
      </MenuLayout>
    );
  }

  if (!os) {
    return (
      <MenuLayout>
        <div className="px-10 py-8 max-w-7xl mx-auto text-center text-red-500">Ordem de serviço não encontrada.</div>
      </MenuLayout>
    );
  }

  const aparelho = [os.categoria, os.marca, os.modelo, os.cor].filter(Boolean).join(' ');
  // const entrada = os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '';
  // const valor = ((os.valor_servico || 0) + (os.valor_peca || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <ProtectedArea area="bancada">
      <MenuLayout>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
          >
            ← Voltar para Bancada
          </Button>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              os.status === 'ABERTA' ? 'bg-yellow-100 text-yellow-800' :
              os.status === 'EM_ANALISE' ? 'bg-blue-100 text-blue-800' :
              os.status === 'AGUARDANDO_PECA' ? 'bg-orange-100 text-orange-800' :
              os.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {os.status === 'ABERTA' ? 'Aguardando' :
               os.status === 'EM_ANALISE' ? 'Em Análise' :
               os.status === 'AGUARDANDO_PECA' ? 'Aguardando Peça' :
               os.status === 'CONCLUIDO' ? 'Concluído' : os.status}
            </span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <FiClipboard className="text-blue-600" />
          Ordem #{os.numero_os || os.id}
        </h1>

        {/* Barra de progresso da OS (mock, pode ser melhorada com status reais) */}
        {/* ... manter steps ou adaptar conforme status reais ... */}

        <section className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <FiClipboard className="text-blue-600" />
            Detalhes da OS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Cliente</p>
              <p className="text-base text-gray-800 font-medium">{os.cliente?.nome || '---'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Aparelho</p>
              <p className="text-base text-gray-800">{aparelho || '---'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Número de Série</p>
              <p className="text-base text-gray-800">{os.numero_serie || '---'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Data de Entrada</p>
              <p className="text-base text-gray-800">
                {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '---'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Valor Total</p>
              <p className="text-base font-semibold text-blue-600">
                {((parseFloat(os.valor_servico || '0') + parseFloat(os.valor_peca || '0'))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Atendente</p>
              <p className="text-base text-gray-800">{os.atendente || '---'}</p>
            </div>
          </div>
          
          {os.relato && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Relato do Cliente</p>
              <p className="text-sm text-gray-600 leading-relaxed">{os.relato}</p>
            </div>
          )}
          
          {(os.acessorios || os.condicoes_equipamento) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {os.acessorios && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Acessórios</p>
                  <p className="text-sm text-gray-600">{os.acessorios}</p>
                </div>
              )}
              {os.condicoes_equipamento && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Condições do Equipamento</p>
                  <p className="text-sm text-gray-600">{os.condicoes_equipamento}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Técnico */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiClipboard className="text-blue-600" />
                Status Técnico
              </h2>
              <select
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={statusTecnico}
                onChange={e => setStatusTecnico(e.target.value)}
              >
                <option value="">Selecione o status</option>
                {statusTecnicoOptions.map(option => (
                  <option key={option.id} value={option.nome}>{option.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Produtos utilizados */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiBox className="text-blue-600" />
              Produtos utilizados
            </h2>
            
            {/* Busca de produtos */}
            <ProdutoServicoSearch
              onSelect={handleAdicionarProduto}
              placeholder="Buscar produtos..."
              tipo="produto"
              empresaId={empresaId}
            />

            {/* Produtos salvos anteriormente - Editáveis */}
            {os && (os.peca || (os.valor_peca && parseFloat(os.valor_peca) > 0)) && produtosSelecionados.length === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                    <FiBox className="text-blue-600" size={18} />
                    Produtos já lançados
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        // Carregar produto existente para edição
                        const produtoExistente = {
                          id: 'existing-prod-' + os.id,
                          nome: os.peca || 'Produto existente',
                          preco: parseFloat(os.valor_peca || '0'),
                          quantidade: 1,
                          tipo: 'produto'
                        };
                        setProdutosSelecionados([produtoExistente]);
                      }}
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      title="Editar produtos"
                    >
                      <FiEdit size={14} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Remover Produtos',
                          message: 'Tem certeza que deseja remover todos os produtos desta OS?',
                          confirmText: 'Remover',
                          cancelText: 'Cancelar'
                        });
                        
                        if (confirmed) {
                          // Limpar produtos existentes
                          setProdutos('');
                          // Forçar atualização dos totais
                          if (os) {
                            setOs({ ...os, peca: '', valor_peca: '0' });
                          }
                          addToast('success', 'Produtos removidos com sucesso!');
                        }
                      }}
                      variant="destructive"
                      size="sm"
                      title="Remover produtos"
                    >
                      <FiTrash2 size={14} className="mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiClipboard className="text-blue-600" size={14} />
                      <span className="text-sm font-medium text-blue-900">Descrição:</span>
                      <span className="text-sm text-blue-700">{os.peca || 'Não especificado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium text-blue-900">Valor Total:</span>
                      <span className="text-sm font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded">
                        {formatPrice(parseFloat(os.valor_peca || '0'))}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                    <FiAlertCircle size={12} />
                    <span className="italic">Clique em "Editar" para modificar os produtos</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lista de produtos selecionados */}
            {produtosSelecionados.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Produtos selecionados para edição:</h3>
                <div className="space-y-2">
                  {produtosSelecionados.map((produto) => (
                    <div key={produto.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700 w-16">Nome:</label>
                        <input
                          type="text"
                          value={produto.nome}
                          onChange={(e) => handleEditarProduto(produto.id, e.target.value, produto.preco, produto.quantidade)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Nome do produto"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700 w-16">Preço:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={produto.preco}
                          onChange={(e) => handleEditarProduto(produto.id, produto.nome, parseFloat(e.target.value) || 0, produto.quantidade)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0,00"
                        />
                        <span className="text-sm text-gray-600">{formatPrice(produto.preco)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={produto.quantidade}
                          onChange={(e) => handleAlterarQuantidade(produto.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => handleRemoverProduto(produto.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    Total produtos: {formatPrice(calcularTotalProdutos())}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Serviços realizados */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiTool className="text-blue-600" />
              Serviços realizados
            </h2>
            
            {/* Busca de serviços */}
            <ProdutoServicoSearch
              onSelect={handleAdicionarServico}
              placeholder="Buscar serviços..."
              tipo="servico"
              empresaId={empresaId}
            />

            {/* Serviços salvos anteriormente - Editáveis */}
            {os && (os.servico || (os.valor_servico && parseFloat(os.valor_servico) > 0)) && servicosSelecionados.length === 0 && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-green-900 flex items-center gap-2">
                    <FiTool className="text-green-600" size={18} />
                    Serviços já lançados
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        // Carregar serviço existente para edição
                        const servicoExistente = {
                          id: 'existing-serv-' + os.id,
                          nome: os.servico || 'Serviço existente',
                          preco: parseFloat(os.valor_servico || '0'),
                          tipo: 'servico'
                        };
                        setServicosSelecionados([servicoExistente]);
                      }}
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      title="Editar serviços"
                    >
                      <FiEdit size={14} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Remover Serviços',
                          message: 'Tem certeza que deseja remover todos os serviços desta OS?',
                          confirmText: 'Remover',
                          cancelText: 'Cancelar'
                        });
                        
                        if (confirmed) {
                          // Limpar serviços existentes
                          setServicos('');
                          // Forçar atualização dos totais
                          if (os) {
                            setOs({ ...os, servico: '', valor_servico: '0' });
                          }
                          addToast('success', 'Serviços removidos com sucesso!');
                        }
                      }}
                      variant="destructive"
                      size="sm"
                      title="Remover serviços"
                    >
                      <FiTrash2 size={14} className="mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-green-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiClipboard className="text-green-600" size={14} />
                      <span className="text-sm font-medium text-green-900">Descrição:</span>
                      <span className="text-sm text-green-700">{os.servico || 'Não especificado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium text-green-900">Valor Total:</span>
                      <span className="text-sm font-bold text-green-800 bg-green-200 px-2 py-1 rounded">
                        {formatPrice(parseFloat(os.valor_servico || '0'))}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                    <FiAlertCircle size={12} />
                    <span className="italic">Clique em "Editar" para modificar os serviços</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lista de serviços selecionados */}
            {servicosSelecionados.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Serviços selecionados para edição:</h3>
                <div className="space-y-2">
                  {servicosSelecionados.map((servico) => (
                    <div key={servico.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700 w-16">Nome:</label>
                        <input
                          type="text"
                          value={servico.nome}
                          onChange={(e) => handleEditarServico(servico.id, e.target.value, servico.preco)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Nome do serviço"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700 w-16">Preço:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={servico.preco}
                          onChange={(e) => handleEditarServico(servico.id, servico.nome, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0,00"
                        />
                        <span className="text-sm text-gray-600">{formatPrice(servico.preco)}</span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoverServico(servico.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    Total serviços: {formatPrice(calcularTotalServicos())}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Laudo Técnico */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiClipboard className="text-blue-600" />
              Laudo Técnico
            </h2>
            <textarea
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              value={laudo}
              onChange={e => setLaudo(e.target.value)}
              placeholder="Descreva o diagnóstico técnico com todos os detalhes relevantes..."
            />
          </div>

          {/* Imagens do Equipamento */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiCamera className="text-blue-600" />
              Imagens do Equipamento
            </h2>
            
            {/* Upload de novas imagens */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload-edit"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload-edit" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-4xl">📷</div>
                    <p className="text-sm text-gray-600">
                      Clique para selecionar imagens ou arraste aqui
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG até 5MB cada • Máximo 10 imagens
                    </p>
                    {imagens.length > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        {imagens.length} imagem{imagens.length !== 1 ? 'ns' : ''} selecionada{imagens.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Preview das novas imagens */}
              {previewImagens.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Novas Imagens</h4>
                    <button
                      onClick={() => {
                        setImagens([]);
                        setPreviewImagens([]);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Limpar todas
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewImagens.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagens existentes */}
              {imagensExistentes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Imagens Existentes</h4>
                    <button
                      onClick={() => setImagensExistentes([])}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remover todas
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagensExistentes.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleRemoveExistingImage(index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações técnicas */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiClipboard className="text-blue-600" />
              Observações técnicas
            </h2>
            <textarea
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Observações adicionais do técnico..."
            />
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            {mostrarBotaoIniciar && (
              <Button
                onClick={handleIniciarOS}
                disabled={salvando}
                className="inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                size="lg"
              >
                <FiPlayCircle size={16} /> 
                {salvando ? 'Iniciando...' : 'Iniciar OS'}
              </Button>
            )}
            
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              size="lg"
              className="inline-flex items-center gap-2"
            >
              <FiSave size={16} /> 
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
      </MenuLayout>
    </ProtectedArea>
  );
}