'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import MenuLayout from '@/components/MenuLayout';
import ProdutoServicoManager from '@/components/ProdutoServicoManager';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useStatusHistorico } from '@/hooks/useStatusHistorico';
import { FiArrowLeft, FiSave, FiUser, FiCheckCircle, FiTool, FiFileText } from 'react-icons/fi';

interface Item {
  id?: string;
  nome: string;
  preco: number;
  quantidade: number;
  total: number;
}

interface Ordem {
  id: string;
  numero_os: string;
  cliente_id: string;
  status: string;
  status_tecnico: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  numero_serie?: string;
  relato?: string;
  observacoes?: string;
  problema_relatado?: string;
  problema_diagnosticado?: string;
  servicos_realizados?: string;
  pecas_trocadas?: string;
  data_entrada?: string;
  data_saida?: string;
  prazo_entrega?: string;
  imagens?: string;
  acessorios?: string;
  condicoes_equipamento?: string;
  termo_garantia_id?: string;
  tecnico_id?: string;
  clientes?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
}

interface Status {
  id: string;
  nome: string;
  cor: string;
}

interface Tecnico {
  id: string;
  nome: string;
  tecnico_id?: string;
  auth_user_id: string;
}

export default function EditarOSSimples() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { usuarioData } = useAuth();
  const { registrarMudancaStatus } = useStatusHistorico();

  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados dos formulários
  const [statusSelecionado, setStatusSelecionado] = useState<Status | null>(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<Tecnico | null>(null);
  const [observacoesInternas, setObservacoesInternas] = useState(''); // Para campo observacao da tabela
  
  // Estados dos dados do equipamento
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [acessorios, setAcessorios] = useState('');
  const [condicoesEquipamento, setCondicoesEquipamento] = useState('');
  
  // Estados dos relatos (campos da tabela)
  const [relato, setRelato] = useState('');
  const [observacao, setObservacao] = useState('');
  const [laudo, setLaudo] = useState('');
  
  // Estados de datas e termo
  const [dataEntrada, setDataEntrada] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [termoGarantiaId, setTermoGarantiaId] = useState('');
  
  // Estados de anexos
  const [imagens, setImagens] = useState<string[]>([]);
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [uploadingImagens, setUploadingImagens] = useState(false);

  // Listas
  const [status, setStatus] = useState<Status[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  
  // Produtos e Serviços
  const [servicos, setServicos] = useState<Item[]>([]);
  const [produtos, setProdutos] = useState<Item[]>([]);

  useEffect(() => {
    if (id) {
      fetchOrdem();
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (usuarioData?.empresa_id) {
      fetchTecnicos();
    }
  }, [usuarioData?.empresa_id]);

  // Atualizar status selecionado quando a ordem for carregada
  useEffect(() => {
    if (ordem && status.length > 0) {
      const statusEncontrado = status.find(s => s.nome === ordem.status);
      if (statusEncontrado) {
        setStatusSelecionado(statusEncontrado);
        }
    }
  }, [ordem, status]);

  // Atualizar técnico selecionado quando a ordem for carregada
  useEffect(() => {
    if (ordem && tecnicos.length > 0) {
      // Buscar por tecnico_id primeiro, depois por auth_user_id como fallback
      let tecnicoEncontrado = tecnicos.find(t => t.tecnico_id === ordem.tecnico_id);
      if (!tecnicoEncontrado) {
        tecnicoEncontrado = tecnicos.find(t => t.auth_user_id === ordem.tecnico_id);
      }
      if (tecnicoEncontrado) {
        setTecnicoSelecionado(tecnicoEncontrado);
        }
    }
  }, [ordem, tecnicos]);

  const fetchOrdem = async () => {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          clientes:cliente_id(nome, telefone, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        addToast('error', 'Erro ao carregar OS');
        return;
      }

      setOrdem(data);
      // Preencher todos os campos (usando campos reais da tabela)
      setObservacoesInternas(data.observacao || ''); // Campo observacao (singular) da tabela
      setMarca(data.marca || '');
      setModelo(data.modelo || '');
      setCor(data.cor || '');
      setNumeroSerie(data.numero_serie || '');
      setAcessorios(data.acessorios || '');
      setCondicoesEquipamento(data.condicoes_equipamento || '');
      setRelato(data.problema_relatado || '');
      setObservacao(data.observacao || '');
      setLaudo(data.laudo || '');
      // setDataEntrada(data.data_entrada ? data.data_entrada.split('T')[0] : '');
      // setDataSaida(data.data_saida ? data.data_saida.split('T')[0] : '');
      // setPrazoEntrega(data.prazo_entrega ? data.prazo_entrega.split('T')[0] : '');
      setTermoGarantiaId(data.termo_garantia_id || '');
      
      // Processar imagens
      if (data.imagens) {
        const imagensArray = data.imagens.split(',').filter((img: string) => img.trim());
        setImagens(imagensArray);
      }
      
      // Carregar produtos e serviços dos campos de texto
      if (data.peca) {
        const produtosParsed = parseTextToItems(data.peca, 'produto');
        setProdutos(produtosParsed);
      }

      if (data.servico) {
        const servicosParsed = parseTextToItems(data.servico, 'servico');
        setServicos(servicosParsed);
      }

    } catch (error) {
      addToast('error', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('status_fixo')
        .select('*')
        .eq('tipo', 'os')
        .order('ordem');
      
      if (data) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const fetchTecnicos = async () => {
    try {
      if (!usuarioData?.empresa_id) {

        addToast('error', 'Erro: dados do usuário não carregados. Tente fazer login novamente.');
        return;
      }
      
      // Adicionar timeout para evitar travamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao buscar técnicos')), 10000);
      });
      
      const fetchPromise = supabase
        .from('usuarios')
        .select('id, nome, tecnico_id, auth_user_id')
        .eq('nivel', 'tecnico')
        .eq('empresa_id', usuarioData.empresa_id) // Filtrar por empresa do usuário logado
        .order('nome');
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Erro ao buscar técnicos:', error);
        addToast('error', 'Erro ao carregar lista de técnicos');
        return;
      }
      
      if (data) {
        setTecnicos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
      addToast('error', 'Erro inesperado ao carregar técnicos');
    }
  };

  const calcularTotais = () => {
    const totalServicos = servicos.reduce((acc, s) => {
      const preco = typeof s.preco === 'string' ? parseFloat(s.preco) : s.preco;
      const quantidade = s.quantidade ?? 1;
      const totalItem = (isNaN(preco) ? 0 : preco) * quantidade;
      return acc + totalItem;
    }, 0);
    
    const totalProdutos = produtos.reduce((acc, p) => {
      const quantidade = typeof p.quantidade === 'string' ? parseInt(p.quantidade) : (p.quantidade ?? 0);
      const preco = typeof p.preco === 'string' ? parseFloat(p.preco) : (p.preco ?? 0);
      const valor = (isNaN(quantidade) ? 0 : quantidade) * (isNaN(preco) ? 0 : preco);
      return acc + valor;
    }, 0);
    
    return {
      totalServicos,
      totalProdutos,
      totalGeral: totalServicos + totalProdutos
    };
  };

  const handleSalvar = async () => {
    const confirmed = await confirm({
      title: 'Salvar Alterações',
      message: 'Deseja salvar as alterações na ordem de serviço?',
      confirmText: 'Salvar',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;

    setSaving(true);
    try {
      // Fazer upload das novas imagens primeiro
      let novasUrls: string[] = [];
      if (novasImagens.length > 0) {
        novasUrls = await uploadImagens();
        if (novasUrls.length === 0) {
          setSaving(false);
          return;
        }
      }

      // Combinar imagens existentes com novas
      const todasImagens = [...imagens, ...novasUrls];

      const totais = calcularTotais();
      
      // Determinar status técnico automático
      let novoStatusTecnico = ordem?.status_tecnico || '';
      const normalize = (s: string) => (s || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
      const sel = normalize(statusSelecionado?.nome || '');
      if (sel === 'APROVADO') {
        novoStatusTecnico = 'APROVADO';
      } else if (sel === 'ENTREGUE') {
        novoStatusTecnico = 'FINALIZADA';
      } else if (sel === 'AGUARDANDO APROVACAO') {
        novoStatusTecnico = 'AGUARDANDO APROVAÇÃO';
      }

      // ✅ HISTÓRICO DE RECUSAS: Registrar automaticamente quando cliente recusa
      let observacoesAtualizadas = observacoesInternas;
      const statusRecusado = sel.includes('RECUS') || sel.includes('NEGOU') || sel.includes('NAO APROVOU');
      
      if (statusRecusado) {
        const dataRecusa = new Date().toLocaleString('pt-BR');
        const registroRecusa = `🚫 CLIENTE RECUSOU ORÇAMENTO - ${dataRecusa}`;
        
        // Verificar se já não existe esse registro para evitar duplicatas
        if (!observacoesAtualizadas?.includes('🚫 CLIENTE RECUSOU ORÇAMENTO')) {
          observacoesAtualizadas = observacoesAtualizadas 
            ? `${observacoesAtualizadas}\n\n${registroRecusa}`
            : registroRecusa;
        }
      }

      const updateData: any = {
        status: statusSelecionado?.nome || ordem?.status,
        status_tecnico: novoStatusTecnico,
        valor_servico: totais.totalServicos,
        valor_peca: totais.totalProdutos,
        valor_faturado: totais.totalGeral,
        peca: produtos.map(p => {
          const preco = typeof p.preco === 'number' ? p.preco : parseFloat(String(p.preco));
          const quantidade = typeof p.quantidade === 'number' ? p.quantidade : parseInt(String(p.quantidade));
          const valor = (isNaN(preco) ? 0 : preco);
          const qtd = (isNaN(quantidade) ? 0 : quantidade);
          return `${p.nome} - Qtd: ${qtd} - Valor: R$ ${valor.toFixed(2)}`;
        }).join('\n'),
        servico: servicos.map(s => {
          const preco = typeof s.preco === 'number' ? s.preco : parseFloat(String(s.preco));
          const valor = (isNaN(preco) ? 0 : preco);
          return `${s.nome} - Valor: R$ ${valor.toFixed(2)}`;
        }).join('\n'),
        observacao: observacoesAtualizadas, // Campo observacao com histórico de recusas
        // Dados do equipamento
        marca: marca,
        modelo: modelo,
        cor: cor,
        numero_serie: numeroSerie,
        acessorios: acessorios,
        condicoes_equipamento: condicoesEquipamento,
        // Relatos (campos reais da tabela)
        problema_relatado: relato,
        laudo: laudo,
        // Anexos
        imagens: todasImagens.join(','),
        // Datas (comentado - colunas não existem ainda)
        // data_entrada: dataEntrada ? new Date(dataEntrada).toISOString() : null,
        // data_saida: dataSaida ? new Date(dataSaida).toISOString() : null,
        // prazo_entrega: prazoEntrega ? new Date(prazoEntrega).toISOString() : null,
        termo_garantia_id: termoGarantiaId || null
      };

      // Adicionar técnico se selecionado
      if (tecnicoSelecionado?.tecnico_id || tecnicoSelecionado?.auth_user_id) {
        updateData.tecnico_id = tecnicoSelecionado.tecnico_id || tecnicoSelecionado.auth_user_id;
      }

      // Se ENTREGUE, adiciona datas (tipo date)
      if (sel === 'ENTREGUE') {
        const hoje = new Date();
        const dataStr = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())).toISOString().slice(0,10);
        const garantia = new Date(hoje);
        garantia.setDate(garantia.getDate() + 90);
        const garantiaStr = new Date(Date.UTC(garantia.getFullYear(), garantia.getMonth(), garantia.getDate())).toISOString().slice(0,10);
        updateData.data_entrega = dataStr;
        updateData.vencimento_garantia = garantiaStr;
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(updateData)
        .eq('id', id);

      if (error) {
        addToast('error', 'Erro ao salvar: ' + error.message);
        return;
      }

      // ✅ REGISTRAR MUDANÇA DE STATUS NO HISTÓRICO (opcional - não bloqueia salvamento)
      try {
        const statusAnterior = ordem?.status || null;
        const statusTecnicoAnterior = ordem?.status_tecnico || null;
        const statusNovo = statusSelecionado?.nome || ordem?.status || '';
        
        if (statusAnterior !== statusNovo || statusTecnicoAnterior !== novoStatusTecnico) {
          const motivo = statusRecusado ? 'Cliente recusou o orçamento' : 
                       sel === 'ENTREGUE' ? 'OS finalizada e entregue ao cliente' :
                       sel === 'APROVADO' ? 'Orçamento aprovado pelo cliente' :
                       'Mudança de status via sistema';
          
          const historicoSucesso = await registrarMudancaStatus(
            id,
            statusAnterior,
            statusNovo,
            statusTecnicoAnterior,
            novoStatusTecnico,
            motivo,
            observacoesAtualizadas !== observacoesInternas ? 'Observações atualizadas automaticamente' : undefined
          );
          
          if (historicoSucesso) {
            console.log('✅ Histórico de status registrado com sucesso');
          } else {
            console.warn('⚠️ Falha ao registrar histórico, mas OS foi salva');
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao registrar histórico (não crítico):', error);
        // Não interrompe o fluxo - histórico é opcional
      }

      addToast('success', '✅ Ordem de serviço atualizada com sucesso!');
      router.push('/ordens');

    } catch (error) {
      addToast('error', 'Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para fazer upload de imagens
  const uploadImagens = async () => {
    if (novasImagens.length === 0) return [];
    
    setUploadingImagens(true);
    const uploadedUrls: string[] = [];
    
    try {
      const formData = new FormData();
      formData.append('ordemId', id);
      
      novasImagens.forEach((file) => {
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
      addToast('success', `✅ ${uploadedUrls.length} anexo(s) enviado(s) com sucesso!`);
      
      // Limpar arquivos selecionados após upload bem-sucedido
      setNovasImagens([]);
      
    } catch (error) {
      console.error('Erro no upload das imagens:', error);
      addToast('error', 'Erro inesperado no upload das imagens');
    } finally {
      setUploadingImagens(false);
    }
    
    return uploadedUrls;
  };

  // Função para remover anexo
  const removerAnexo = (index: number) => {
    const novasImagensList = [...imagens];
    novasImagensList.splice(index, 1);
    setImagens(novasImagensList);
    addToast('success', 'Anexo removido com sucesso!');
  };

  // Função para converter texto em itens estruturados
  const parseTextToItems = (texto: string, tipo: 'produto' | 'servico') => {
    if (!texto || texto.trim() === '') return [];
    
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const itens = [];
    
    for (const linha of linhas) {
      if (tipo === 'produto') {
        // Formato: "Nome - Qtd: X - Valor: R$ Y.YY"
        const match = linha.match(/^(.+?)\s*-\s*Qtd:\s*(\d+)\s*-\s*Valor:\s*R\$\s*([\d,]+\.?\d*)$/);
        if (match) {
          const preco = parseFloat(match[3].replace(',', ''));
          const quantidade = parseInt(match[2]) || 1;
          const item = {
            id: `temp-${Date.now()}-${Math.random()}`,
            nome: match[1].trim(),
            quantidade,
            preco: isNaN(preco) ? 0 : preco,
            total: (isNaN(preco) ? 0 : preco) * quantidade
          };
          itens.push(item);
        } else {
          }
      } else {
        // Formato: "Nome - Valor: R$ Y.YY"
        let match = linha.match(/^(.+?)\s*-\s*Valor:\s*R\$\s*([\d,]+\.?\d*)$/);
        if (match) {
          const preco = parseFloat(match[2].replace(',', ''));
          const quantidade = 1;
          const item = {
            id: `temp-${Date.now()}-${Math.random()}`,
            nome: match[1].trim(),
            preco: isNaN(preco) ? 0 : preco,
            quantidade,
            total: (isNaN(preco) ? 0 : preco) * quantidade
          };
          itens.push(item);
        } else {
          // Tentar outros formatos possíveis
          match = linha.match(/^(.+?)\s*-\s*([\d,]+\.?\d*)$/); // "Nome - 160.00"
          if (match) {
            const preco = parseFloat(match[2].replace(',', ''));
            const quantidade = 1;
            const item = {
              id: `temp-${Date.now()}-${Math.random()}`,
              nome: match[1].trim(),
              preco: isNaN(preco) ? 0 : preco,
              quantidade,
              total: (isNaN(preco) ? 0 : preco) * quantidade
            };
            itens.push(item);
          } else {
            // Tentar formato com "Valor:" sem R$
            match = linha.match(/^(.+?)\s*-\s*Valor:\s*([\d,]+\.?\d*)$/);
            if (match) {
              const preco = parseFloat(match[2].replace(',', ''));
              const quantidade = 1;
              const item = {
                id: `temp-${Date.now()}-${Math.random()}`,
                nome: match[1].trim(),
                preco: isNaN(preco) ? 0 : preco,
                quantidade,
                total: (isNaN(preco) ? 0 : preco) * quantidade
              };
              itens.push(item);
            } else {
              // Tentar formato simples (só o nome) - usar valor padrão
              const nomeSimples = linha.trim();
              if (nomeSimples) {
                const item = {
                  id: `temp-${Date.now()}-${Math.random()}`,
                  nome: nomeSimples,
                  preco: 0, // Valor padrão 0 para evitar NaN
                  quantidade: 1,
                  total: 0
                };
                itens.push(item);
              }
            }
          }
        }
      }
    }
    
    return itens;
  };

  if (loading) {
    return (
      <MenuLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ordem de serviço...</p>
          </div>
        </div>
      </MenuLayout>
    );
  }

  const totais = calcularTotais();

  return (
    <MenuLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Editar OS #{ordem?.numero_os}
                </h1>
                <p className="text-gray-600">
                  Cliente: {ordem?.clientes?.nome || 'N/A'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiSave size={16} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {/* Informações do Cliente e OS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUser className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Informações</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                <p className="text-gray-600">{ordem?.clientes?.nome || 'N/A'}</p>
                {ordem?.clientes?.telefone && (
                  <p className="text-sm text-gray-500">{ordem.clientes.telefone}</p>
                )}
                {ordem?.clientes?.email && (
                  <p className="text-sm text-gray-500">{ordem.clientes.email}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ordem de Serviço</h4>
                <p className="text-gray-600">#{ordem?.numero_os}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className="font-medium">{ordem?.status || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Status Técnico: <span className="font-medium">{ordem?.status_tecnico || 'N/A'}</span>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Equipamento</h4>
                <p className="text-gray-600">{marca || 'N/A'} {modelo || ''}</p>
                <p className="text-sm text-gray-500">Cor: {cor || 'N/A'}</p>
                <p className="text-sm text-gray-500">Série: {numeroSerie || 'N/A'}</p>
                {acessorios && <p className="text-sm text-gray-500">Acessórios: {acessorios}</p>}
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              </div>
              <select
                value={statusSelecionado?.id || ''}
                onChange={(e) => {
                  const statusEncontrado = status.find(s => s.id === e.target.value);
                  setStatusSelecionado(statusEncontrado || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione...</option>
                {status.length === 0 && <option disabled>Carregando status...</option>}
                {status.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {status.length === 0 ? 'Nenhum status carregado' : `${status.length} status disponíveis`}
              </div>
            </div>

            {/* Técnico */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiTool className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Técnico</h3>
              </div>
              <select
                value={tecnicoSelecionado?.id || ''}
                onChange={(e) => {
                  const tecnico = tecnicos.find(t => t.id === e.target.value);
                  setTecnicoSelecionado(tecnico || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione...</option>
                {tecnicos.length === 0 && <option disabled>Carregando técnicos...</option>}
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {tecnicos.length === 0 ? 'Nenhum técnico carregado' : `${tecnicos.length} técnicos disponíveis`}
              </div>
            </div>

            {/* Total Geral */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiFileText className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Total</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Serviços:</span>
                  <span>{formatCurrency(totais.totalServicos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produtos:</span>
                  <span>{formatCurrency(totais.totalProdutos)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(totais.totalGeral)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Equipamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiTool className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dados do Equipamento</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Marca do equipamento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Modelo do equipamento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <input
                  type="text"
                  value={cor}
                  onChange={(e) => setCor(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Cor do equipamento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Série</label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Número de série"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acessórios</label>
                <input
                  type="text"
                  value={acessorios}
                  onChange={(e) => setAcessorios(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Acessórios entregues"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condições</label>
                <input
                  type="text"
                  value={condicoesEquipamento}
                  onChange={(e) => setCondicoesEquipamento(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Condições do equipamento"
                />
              </div>
            </div>
            
            {/* Campos de Relato e Observações */}
            <div className="mt-6 space-y-4">
                            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relato do Cliente</label>
                <textarea
                  value={relato}
                  onChange={(e) => setRelato(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  rows={3}
                  placeholder="O que o cliente relatou sobre o problema..."
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações Internas do Atendente</label>
                <textarea
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  rows={3}
                  placeholder="Observações internas sobre a ordem de serviço (visível apenas para equipe)..."
                />

              </div>
            </div>
          </div>

          {/* Relatos do Técnico */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiFileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Relatos do Técnico</h3>
              <span className="text-sm text-gray-500">(Preenchido pelo técnico)</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Laudo Técnico</label>
              <textarea
                value={laudo}
                onChange={(e) => setLaudo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                rows={4}
                placeholder="Diagnóstico detalhado e procedimentos realizados..."
              />
            </div>
          </div>

          {/* Datas e Prazos - TEMPORARIAMENTE OCULTO (colunas não existem) */}
          {false && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiUser className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Datas e Prazos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Entrada</label>
                  <input
                    type="date"
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Saída</label>
                  <input
                    type="date"
                    value={dataSaida}
                    onChange={(e) => setDataSaida(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Entrega</label>
                  <input
                    type="date"
                    value={prazoEntrega}
                    onChange={(e) => setPrazoEntrega(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gerenciadores de Produtos e Serviços */}
          <div className="space-y-6">
            <ProdutoServicoManager
              tipo="servico"
              itens={servicos}
              onItensChange={setServicos}
            />
            
            <ProdutoServicoManager
              tipo="produto"
              itens={produtos}
              onItensChange={setProdutos}
            />
          </div>

          {/* Upload de Anexos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiFileText className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Anexos</h3>
            </div>
            
            <div className="space-y-4">
              {/* Upload de novas imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Fotos/Documentos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    id="file-upload"
                    disabled={uploadingImagens}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setNovasImagens(prev => [...prev, ...files]);
                      addToast('success', `${files.length} arquivo(s) selecionado(s)`);
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiFileText className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingImagens ? 'Fazendo upload...' : 'Clique para adicionar fotos ou documentos'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Formatos: JPG, PNG, PDF
                    </span>
                  </label>
                </div>
              </div>

              {/* Novas imagens selecionadas */}
              {novasImagens.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Novos Anexos Selecionados ({novasImagens.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {novasImagens.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <FiFileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 truncate px-2">
                              {file.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setNovasImagens(prev => prev.filter((_, i) => i !== index));
                            addToast('success', 'Arquivo removido da seleção');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Remover arquivo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagens existentes */}
              {imagens.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Anexos Existentes ({imagens.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagens.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Anexo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => window.open(img, '_blank')}
                            className="text-white text-sm font-medium px-3 py-1 bg-blue-600 rounded"
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </MenuLayout>
  );
}
