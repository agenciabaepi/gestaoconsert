"use client";
import React, { useState, useEffect } from 'react';
import MenuLayout from '@/components/MenuLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { FiMaximize, FiMinimize, FiUser, FiUserPlus, FiSearch, FiX } from 'react-icons/fi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SearchInput } from '@/components/SearchInput';
import { ToastProvider, useToast } from '@/components/Toast';
import { ConfirmProvider, useConfirm } from '@/components/ConfirmDialog';
import Dialog from '@/components/Dialog';
import { CupomVenda } from '@/components/CupomVenda';
import { useCaixa } from '@/hooks/useCaixa';
import { AbrirCaixaModal } from '@/components/caixa/AbrirCaixaModal';
import { FecharCaixaModal } from '@/components/caixa/FecharCaixaModal';
import { interceptSupabaseQuery } from '@/utils/supabaseInterceptor';
import { FiUnlock, FiLock, FiMinus, FiPlus, FiEye, FiShoppingCart, FiTrash2 } from 'react-icons/fi';

interface ProdutoSupabase {
  id: string;
  nome: string;
  preco: number;
  obs?: string;
  categoria?: string;
  imagens_url?: string[];
  tipo: string;
  ativo: boolean;
  codigo_barras?: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria?: string;
  imagem_url?: string;
  tipo: string;
  codigo_barras?: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  celular: string;
  email: string;
  documento: string;
  numero_cliente: string;
}

export default function CaixaPage() {
  const { user, usuarioData, empresaData } = useAuth();
  const { addToast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<(Produto & { qty: number })[]>([]);
  const [orderType, setOrderType] = useState('Local');
  const [paymentType, setPaymentType] = useState('Dinheiro');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pdvRef = React.useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para seleção de cliente
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const clienteSearchRef = React.useRef<HTMLDivElement>(null);

  // Modal cadastro rápido de cliente
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteDocumento, setNovoClienteDocumento] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteSearchRef.current && !clienteSearchRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Buscar clientes
  const buscarClientes = async (search = '') => {
    if (!usuarioData?.empresa_id) return;
    
    setLoadingClientes(true);
    try {
      const response = await fetch(`/api/clientes?empresaId=${usuarioData.empresa_id}&search=${search}`);
      const data = await response.json();
      
      if (data.clientes) {
        setClientes(data.clientes);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
    setLoadingClientes(false);
  };

  // Selecionar cliente
  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setSearchCliente(cliente.nome);
    setShowClienteDropdown(false);
  };

  // Remover cliente selecionado
  const removerCliente = () => {
    setClienteSelecionado(null);
    setSearchCliente('');
  };

  // Buscar clientes quando digitar
  const handleSearchCliente = (value: string | undefined) => {
    if (value !== undefined) {
      setSearchCliente(value);
      if (value.length >= 2) {
        buscarClientes(value);
        setShowClienteDropdown(true);
      } else {
        setShowClienteDropdown(false);
      }
    }
  };

  // Função para alternar tela cheia interna do sistema
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Remover listener do fullscreen do navegador
  // React.useEffect(() => {
  //   const handleFullscreenChange = () => {
  //     if (!document.fullscreenElement) {
  //       setIsFullscreen(false);
  //     }
  //   };
  //   document.addEventListener('fullscreenchange', handleFullscreenChange);
  //   document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  //   return () => {
  //     document.removeEventListener('fullscreenchange', handleFullscreenChange);
  //     document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  //   };
  // }, []);

  // Buscar produtos reais do Supabase
  useEffect(() => {
    async function fetchProdutos() {
      setLoading(true);
      if (!usuarioData?.empresa_id) return;
      
      const { data, error } = await interceptSupabaseQuery('produtos_servicos', async () => {
        return await supabase
          .from('produtos_servicos')
          .select('id, nome, preco, obs, categoria, imagens_url, tipo, ativo, codigo_barras')
          .eq('empresa_id', usuarioData.empresa_id)
          .eq('ativo', true)
          .eq('tipo', 'produto')
          .order('nome', { ascending: true });
      });
      
      if (error && error.code === 'TABLE_NOT_EXISTS') {
        // Usar produtos de teste se a tabela não existir
        setProdutos([]);
      } else if (error) {
        // Suprimir erros 404 silenciosamente
        if (error.code !== 'PGRST116' && !error.message?.includes('404')) {
          console.error('Erro ao buscar produtos:', error);
        }
        setProdutos([]);
      } else if (data) {
        setProdutos((data as any[])?.map((p: ProdutoSupabase) => ({
          ...p,
          imagem_url: Array.isArray(p.imagens_url) && p.imagens_url.length > 0 ? p.imagens_url[0] : undefined,
          descricao: p.obs || ''
        })));
      }
      setLoading(false);
    }
    fetchProdutos();
  }, [usuarioData?.empresa_id]);

  // Categorias dinâmicas
  const categoriasUnicas = [
    'Todos',
    ...Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean)))
  ].filter((category): category is string => category !== undefined);

  // Filtro de produtos incluindo busca parcial por código de barras
  const filteredProducts = selectedCategory === 'Todos'
    ? produtos.filter(p => {
        const nome = p.nome?.toLowerCase() || '';
        const categoria = p.categoria?.toLowerCase() || '';
        const codigoBarras = (p.codigo_barras || '').toString().toLowerCase();
        const termo = searchTerm.toLowerCase();
        if (termo) {
          }
        return (
          nome.includes(termo) ||
          codigoBarras.includes(termo) ||
          categoria.includes(termo) ||
          termo === ''
        );
      })
    : produtos.filter(p => {
        const nome = p.nome?.toLowerCase() || '';
        const codigoBarras = (p.codigo_barras || '').toString().toLowerCase();
        const termo = searchTerm.toLowerCase();
        return (
          p.categoria === selectedCategory &&
          (nome.includes(termo) || codigoBarras.includes(termo) || termo === '')
        );
      });

  // Se o usuário digitar um código de barras exato e só houver um produto, adicionar automaticamente ao carrinho
  useEffect(() => {
    if (searchTerm.length > 4) {
      const match = produtos.find(
        p => (p.codigo_barras || '').toString().toLowerCase() === searchTerm.toLowerCase()
      );
      if (match) {
        addToCart(match);
        setSearchTerm('');
      }
    }
    // eslint-disable-next-line
  }, [searchTerm]);

  // Exibir apenas os 9 primeiros produtos
  const produtosExibidos = filteredProducts.slice(0, 9);

  const addToCart = (product: Produto) => {
    setCart(prev => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const confirm = useConfirm();

  // Remover item do carrinho com confirmação
  const removeFromCart = async (id: string) => {
    const item = cart.find(i => i.id === id);
    const ok = await confirm({
      title: 'Remover produto',
      message: `Deseja remover "${item?.nome}" do carrinho?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    });
    if (!ok) return;
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
  const discount = 0;
  const total = subtotal + discount;

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [modalFecharVenda, setModalFecharVenda] = useState(false);
  const [descontoModal, setDescontoModal] = useState(0);
  const [acrescimoModal, setAcrescimoModal] = useState(0);
  const [modalImprimir, setModalImprimir] = useState(false);
  interface UltimaVenda {
    numeroVenda: number;
    cliente: Cliente | undefined;
    produtos: (Produto & { qty: number })[];
    total: number;
    desconto: number;
    acrescimo: number;
    pagamento: string;
    data: string;
  }

  const [ultimaVenda, setUltimaVenda] = useState<UltimaVenda | null>(null);

  useEffect(() => {
    async function fetchUsuarioId() {
      if (user?.id) {
        const { data } = await supabase
          .from('usuarios')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (data?.id) setUsuarioId(data.id);
      }
    }
    fetchUsuarioId();
  }, [user]);

  // Função para registrar venda no Supabase
  async function registrarVendaNoSupabase(desconto = 0, acrescimo = 0) {
    if (!usuarioId || !usuarioData?.empresa_id) return;

    // Buscar o maior número de venda já existente para gerar o próximo
    const { data: ultimaVenda } = await supabase
      .from('vendas')
      .select('numero_venda')
      .eq('empresa_id', usuarioData.empresa_id)
      .order('numero_venda', { ascending: false })
      .limit(1);

    let proximoNumero = 1;
    if (ultimaVenda && ultimaVenda.length > 0 && ultimaVenda[0].numero_venda) {
      proximoNumero = ultimaVenda[0].numero_venda + 1;
    }

    const payload = {
      numero_venda: proximoNumero,
      cliente_id: clienteSelecionado?.id || null,
      usuario_id: usuarioId,
      produtos: cart.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        qtd: item.qty,
        codigo_barras: item.codigo_barras || null
      })),
      total: total - desconto + acrescimo,
      desconto: desconto,
      acrescimo: acrescimo,
      forma_pagamento: paymentType,
      tipo_pedido: orderType,
      status: 'finalizada',
      observacoes: '',
      empresa_id: usuarioData.empresa_id,
      data_venda: new Date().toISOString(),
    };
    const { error } = await supabase.from('vendas').insert([payload]);
    if (error) {
      alert('Erro ao registrar venda: ' + error.message);
      return false;
    }
    return proximoNumero;
  }

  // Finalizar venda
  const finalizarVenda = async (desconto = 0, acrescimo = 0) => {
    if (cart.length === 0) {
      addToast('warning', 'Adicione produtos ao carrinho antes de finalizar a venda.');
      return;
    }

    if (!turnoAtual) {
      addToast('error', 'Abra o caixa antes de realizar vendas!');
      setModalAbrirCaixa(true);
      return;
    }

    // Aqui você pode implementar a lógica de finalização da venda
    // Se houver cliente, registrar venda no cadastro do cliente (agora integrado ao Supabase)
    const numeroVenda = await registrarVendaNoSupabase(desconto, acrescimo);
    if (!numeroVenda) {
      addToast('error', 'Erro ao registrar venda!');
      return;
    }

    // Registrar venda no caixa
    await registrarVenda(numeroVenda.toString(), total - desconto + acrescimo);

    addToast('success', 'Venda finalizada com sucesso!');
    setUltimaVenda({
      numeroVenda: numeroVenda,
      cliente: clienteSelecionado || undefined,
      produtos: cart,
      total: total - desconto + acrescimo,
      desconto,
      acrescimo,
      pagamento: paymentType,
      data: new Date().toLocaleString()
    });
    setModalImprimir(true);
    
    // Limpar carrinho e cliente, mas manter o modo tela cheia
    setCart([]);
    setClienteSelecionado(null);
    setSearchTerm('');
    
    // Manter o foco no campo de busca para próxima venda
    const searchInput = document.querySelector('input[placeholder*="Buscar produto"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  // Funções para movimentações
  const handleSangria = async () => {
    if (!turnoAtual) return;
    
    const valor = parseFloat(valorMovimentacao.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      addToast('error', 'Valor inválido');
      return;
    }

    try {
      await adicionarMovimentacao('sangria', valor, descricaoMovimentacao);
      addToast('success', 'Sangria realizada com sucesso');
      setModalSangria(false);
      setValorMovimentacao('');
      setDescricaoMovimentacao('');
    } catch (_) {
      addToast('error', 'Erro ao realizar sangria');
    }
  };

  const handleSuprimento = async () => {
    if (!turnoAtual) return;
    
    const valor = parseFloat(valorMovimentacao.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      addToast('error', 'Valor inválido');
      return;
    }

    try {
      await adicionarMovimentacao('suprimento', valor, descricaoMovimentacao);
      addToast('success', 'Suprimento realizado com sucesso');
      setModalSuprimento(false);
      setValorMovimentacao('');
      setDescricaoMovimentacao('');
    } catch (_) {
      addToast('error', 'Erro ao realizar suprimento');
    }
  };

  // Função não utilizada, mas mantida para referência futura
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL'
  //   }).format(value);
  // };

  const { 
    turnoAtual, 
    movimentacoes,
    loading: caixaLoading, 
    abrirCaixa, 
    fecharCaixa, 
    adicionarMovimentacao, 
    registrarVenda, 
    calcularSaldoAtual,
    buscarUltimoValorFechamento
  } = useCaixa();

  // Função para fechar caixa
  const handleFecharCaixa = async (valorFechamento: number, valorTroco: number, observacoes?: string) => {
    try {
      await fecharCaixa(valorFechamento, valorTroco, observacoes);
      addToast('success', 'Caixa fechado com sucesso!');
      setModalFecharCaixa(false);
    } catch (error) {
      addToast('error', `Erro ao fechar caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  };
  
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);
  const [modalSangria, setModalSangria] = useState(false);
  const [modalSuprimento, setModalSuprimento] = useState(false);
  const [modalMovimentacoes, setModalMovimentacoes] = useState(false);
  const [valorMovimentacao, setValorMovimentacao] = useState('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [valorUltimoFechamento, setValorUltimoFechamento] = useState(0);
  const [ultimoFechamento, setUltimoFechamento] = useState<{ data: string; usuario: string } | null>(null);

  // Buscar valor do último fechamento quando abrir o modal
  useEffect(() => {
    if (modalAbrirCaixa) {
      buscarUltimoValorFechamento().then(valor => {
        setValorUltimoFechamento(valor);
      });
    }
  }, [modalAbrirCaixa]);

  // Buscar dados do último fechamento quando o caixa estiver fechado
  useEffect(() => {
    if (!turnoAtual && usuarioData?.empresa_id) {
      buscarUltimoFechamento();
    }
  }, [turnoAtual, usuarioData]);

  // Controlar inicialização para evitar flash
  useEffect(() => {
    if (!caixaLoading && usuarioData && !isInitialized) {
      // Aguarda um pouco para garantir que tudo carregou
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [caixaLoading, usuarioData, isInitialized]);

  const buscarUltimoFechamento = async () => {
    if (!usuarioData?.empresa_id) return;

    try {
      const { data } = await supabase
        .from('turnos_caixa')
        .select(`
          data_fechamento,
          usuario:usuario_id(nome)
        `)
        .eq('empresa_id', usuarioData.empresa_id)
        .eq('status', 'fechado')
        .order('data_fechamento', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setUltimoFechamento({
          data: data.data_fechamento,
          usuario: (data.usuario as any)?.nome || 'N/A'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar último fechamento:', error);
    }
  };

  // Early return para loading - evita qualquer flash
  if (caixaLoading || !isInitialized || !usuarioData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Carregando...</h1>
            <p className="text-gray-600 mb-6">
              Inicializando sistema...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'h-screen overflow-hidden' : ''}`}>
            
            {!isFullscreen ? (
                <MenuLayout>
                {!turnoAtual ? (
                  <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gray-50">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiLock className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Caixa Fechado</h1>
                        <p className="text-gray-600 mb-6">
                          O caixa está fechado. Abra o caixa para começar a realizar vendas.
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => setModalAbrirCaixa(true)}
                        className="w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700"
                      >
                        <FiUnlock className="w-5 h-5 mr-2" />
                        Abrir Caixa
                      </Button>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        {ultimoFechamento ? (
                          <div>
                            <div>Último fechamento: {new Date(ultimoFechamento.data).toLocaleString('pt-BR')}</div>
                            <div>Por: {ultimoFechamento.usuario}</div>
                          </div>
                        ) : (
                          <div>Último fechamento: N/A</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Layout dividido em duas colunas - 50% cada */
                  <div className="flex h-[calc(100vh-80px)]">
                  {/* Produtos - Lado Esquerdo (50%) */}
                  <div className="w-1/2 p-6">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold mb-4">Escolha o produto</h1>
                      
                      <div className="mb-4">
                        <SearchInput
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar produto por nome, código ou categoria..."
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-2 mb-4">
                        {categoriasUnicas.map(category => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'secondary'}
                            onClick={() => setSelectedCategory(category)}
                            className="px-4 py-2"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {loading ? (
                      <div className="text-center text-gray-500 py-20">Carregando produtos...</div>
                    ) : produtos.length === 0 ? (
                      <div className="text-center text-red-500 py-20">Nenhum produto cadastrado ou erro ao buscar produtos.</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-auto">
                        {produtosExibidos.map(produto => (
                          <div 
                            key={produto.id} 
                            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              if (!turnoAtual) {
                                addToast('warning', 'Abra o caixa antes de adicionar produtos!');
                                setModalAbrirCaixa(true);
                                return;
                              }
                              addToCart(produto);
                            }}
                          >
                             <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                              {produto.imagem_url ? (
                                <img 
                                  src={produto.imagem_url} 
                                  alt={produto.nome}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                                  {produto.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                             <div className="p-2">
                               <h3 className="font-semibold text-sm mb-0.5 line-clamp-1 text-gray-800">{produto.nome}</h3>
                               <p className="text-xs text-gray-500 mb-1">{produto.categoria || 'Geral'}</p>
                               <p className="text-sm font-bold text-green-600">
                                R$ {produto.preco.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meu Pedido - Lado Direito (50%) */}
                  <div className="w-1/2 bg-white border-l shadow-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-white sticky top-0 z-10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Meu Pedido</h2>
                        <Button
                          onClick={toggleFullscreen}
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gray-100 transition-colors rounded-full h-8 w-8 p-0"
                        >
                          <FiMaximize size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="px-4 py-3 border-b bg-white">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      {clienteSelecionado ? (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{clienteSelecionado.nome}</p>
                            <p className="text-xs text-gray-500">#{clienteSelecionado.numero_cliente}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setClienteSelecionado(null)} className="hover:bg-red-50 hover:text-red-600 transition-colors h-8 w-8 p-0 rounded-full">
                            <FiX size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative" ref={clienteSearchRef}>
                          <SearchInput
                            value={searchCliente}
                            onChange={(e) => handleSearchCliente(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full"
                          />
                      {showClienteDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-auto mt-1">
                              {loadingClientes ? (
                                <div className="p-3 text-center text-sm text-gray-500">Carregando...</div>
                              ) : clientes.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                              Nenhum cliente encontrado
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setNovoClienteNome(searchCliente.trim());
                                    setNovoClienteDocumento('');
                                    setNovoClienteTelefone('');
                                    setModalNovoCliente(true);
                                  }}
                                  className="w-full"
                                >
                                  Cadastrar cliente "{searchCliente}"
                                </Button>
                              </div>
                            </div>
                              ) : (
                                <div>
                                  {clientes.map((cliente) => (
                                    <div
                                      key={cliente.id}
                                      onClick={() => selecionarCliente(cliente)}
                                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    >
                                      <p className="font-medium text-sm">{cliente.nome}</p>
                                      <p className="text-xs text-gray-500">#{cliente.numero_cliente}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tipo de Pedido */}
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-2">Tipo de Pedido</div>
                      <div className="flex gap-2">
                        {['Local', 'Retirada', 'Entrega'].map(type => (
                          <Button
                            key={type}
                            variant={orderType === type ? 'default' : 'secondary'}
                            className={`px-3 py-1 text-xs font-medium transition-colors ${
                              orderType === type 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-white hover:bg-gray-100 text-gray-700 border'
                            }`}
                            onClick={() => setOrderType(type)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Itens do Carrinho */}
                    <div className="flex-1 overflow-auto px-4 py-2">
                      {cart.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 flex flex-col items-center justify-center h-full">
                          {!turnoAtual ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-xs">
                              <p className="text-sm mb-3">Abra o caixa para começar</p>
                              <Button 
                                onClick={() => setModalAbrirCaixa(true)}
                                className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                                size="sm"
                              >
                                <FiUnlock size={14} className="mr-2" />
                                Abrir Caixa
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FiShoppingCart size={24} className="text-gray-400" />
                              </div>
                              <p className="text-sm">Seu carrinho está vazio</p>
                              <p className="text-xs text-gray-400 mt-1">Adicione produtos clicando nos cards</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cart.map(item => (
                            <div key={item.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                              <div className="flex items-center p-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.nome}</p>
                                  <p className="text-xs text-gray-500">R$ {item.preco.toFixed(2)} × {item.qty}</p>
                                </div>
                                <p className="font-bold text-sm text-green-600 ml-2">R$ {(item.preco * item.qty).toFixed(2)}</p>
                              </div>
                              <div className="flex border-t bg-gray-50">
                                <button 
                                  onClick={() => changeQty(item.id, -1)}
                                  className="flex-1 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-center"
                                >
                                  <FiMinus size={14} className="inline" />
                                </button>
                                <div className="flex-1 py-2 text-center font-medium text-sm border-l border-r">{item.qty}</div>
                                <button 
                                  onClick={() => changeQty(item.id, 1)}
                                  className="flex-1 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-center"
                                >
                                  <FiPlus size={14} className="inline" />
                                </button>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="flex-1 py-2 text-red-500 hover:bg-red-50 transition-colors text-center border-l"
                                >
                                  <FiTrash2 size={14} className="inline" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controles do Caixa (quando caixa aberto) */}
                    {turnoAtual && (
                      <div className="px-4 py-3 border-t border-b bg-gray-50">
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalSangria(true)}
                            className="flex items-center justify-center gap-1 h-9"
                          >
                            <FiMinus size={12} />
                            <span className="text-xs">Sangria</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalSuprimento(true)}
                            className="flex items-center justify-center gap-1 h-9"
                          >
                            <FiPlus size={12} />
                            <span className="text-xs">Suprimento</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalMovimentacoes(true)}
                            className="flex items-center justify-center gap-1 h-9"
                          >
                            <FiEye size={12} />
                            <span className="text-xs">Movimentações</span>
                          </Button>
                          <Button
                            onClick={() => setModalFecharCaixa(true)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 flex items-center justify-center gap-1 h-9"
                          >
                            <FiLock size={12} />
                            <span className="text-xs">Fechar</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Totais e Finalização */}
                    <div className="p-4 border-t bg-white sticky bottom-0">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-xl font-bold text-gray-800">R$ {total.toFixed(2)}</div>
                      </div>
                      <Button 
                        className="w-full py-3 font-bold bg-green-600 hover:bg-green-700 transition-colors"
                        onClick={() => {
                          if (!turnoAtual) {
                            addToast('warning', 'Abra o caixa antes de finalizar vendas!');
                            setModalAbrirCaixa(true);
                            return;
                          }
                          setModalFecharVenda(true);
                        }}
                        disabled={cart.length === 0}
                      >
                        Fechar venda
                      </Button>
                    </div>
                  </div>
                                  </div>
                )}
                </MenuLayout>
            ) : (
              // Modo Tela Cheia - Layout Igual ao Normal (50/50)
              <div ref={pdvRef} className="h-screen bg-gray-50 flex">
                {/* Produtos - Lado Esquerdo (50%) */}
                <div className="w-1/2 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</div>
                    <div className="flex-1 max-w-xl mx-8">
                      <SearchInput
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button onClick={toggleFullscreen} size="sm" variant="secondary">
                      <FiMinimize size={14} />
                    </Button>
                  </div>

                  <div className="mb-4 flex gap-2 overflow-x-auto">
                    {categoriasUnicas.map(cat => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'secondary'}
                        className={`px-3 py-1 text-sm ${selectedCategory === cat ? 'bg-lime-700 text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {produtosExibidos.map(product => (
                      <div 
                        key={product.id} 
                        className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          if (!turnoAtual) {
                            addToast('warning', 'Abra o caixa antes de adicionar produtos!');
                            setModalAbrirCaixa(true);
                            return;
                          }
                          addToCart(product);
                        }}
                      >
                        <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                          {product.imagem_url ? (
                            <img 
                              src={product.imagem_url} 
                              alt={product.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                              {product.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-1 text-gray-800">{product.nome}</h3>
                          <p className="text-xs text-gray-500 mb-2">{product.categoria || 'Geral'}</p>
                          <p className="text-sm font-bold text-green-600">
                            R$ {product.preco.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meu Pedido - Lado Direito (50%) */}
                <div className="w-1/2 bg-white border-l shadow-lg flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">Meu Pedido</h2>
                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-100 transition-colors rounded-full h-8 w-8 p-0"
                      >
                        <FiMinimize size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Cliente compacto */}
                  <div className="px-4 py-3 border-b bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                    {clienteSelecionado ? (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{clienteSelecionado.nome}</p>
                          <p className="text-xs text-gray-500">#{clienteSelecionado.numero_cliente}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={removerCliente}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors h-8 w-8 p-0 rounded-full"
                        >
                          <FiX size={16} />
                        </Button>
                      </div>
                    ) : (
                      <SearchInput
                        placeholder="Buscar cliente..."
                        value={searchCliente}
                        onChange={(e) => handleSearchCliente(e.target.value)}
                        className="w-full"
                      />
                    )}
                  </div>

                  {/* Tipo de pedido compacto */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="text-sm font-medium text-gray-700 mb-2">Tipo de Pedido</div>
                    <div className="flex gap-2">
                      {['Local', 'Retirada', 'Entrega'].map(type => (
                        <Button
                          key={type}
                          variant={orderType === type ? 'default' : 'secondary'}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            orderType === type 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-white hover:bg-gray-100 text-gray-700 border'
                          }`}
                          onClick={() => setOrderType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Carrinho */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    {cart.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 flex flex-col items-center justify-center h-full">
                        {!turnoAtual ? (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-xs">
                            <p className="text-sm mb-3">Abra o caixa para começar</p>
                            <Button 
                              onClick={() => setModalAbrirCaixa(true)}
                              className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                              size="sm"
                            >
                              <FiUnlock size={14} className="mr-2" />
                              Abrir Caixa
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                              <FiShoppingCart size={24} className="text-gray-400" />
                            </div>
                            <p className="text-sm">Seu carrinho está vazio</p>
                            <p className="text-xs text-gray-400 mt-1">Adicione produtos clicando nos cards</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div key={item.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center p-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.nome}</p>
                                <p className="text-xs text-gray-500">R$ {item.preco.toFixed(2)} × {item.qty}</p>
                              </div>
                              <p className="font-bold text-sm text-green-600 ml-2">R$ {(item.preco * item.qty).toFixed(2)}</p>
                            </div>
                            <div className="flex border-t bg-gray-50">
                              <button 
                                onClick={() => changeQty(item.id, -1)}
                                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-center"
                              >
                                <FiMinus size={14} className="inline" />
                              </button>
                              <div className="flex-1 py-2 text-center font-medium text-sm border-l border-r">{item.qty}</div>
                              <button 
                                onClick={() => changeQty(item.id, 1)}
                                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-center"
                              >
                                <FiPlus size={14} className="inline" />
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="flex-1 py-2 text-red-500 hover:bg-red-50 transition-colors text-center border-l"
                              >
                                <FiTrash2 size={14} className="inline" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controles do caixa em tela cheia */}
                  {turnoAtual && (
                    <div className="px-4 py-3 border-t border-b bg-gray-50">
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalSangria(true)}
                          className="flex items-center justify-center gap-1 h-9"
                        >
                          <FiMinus size={12} />
                          <span className="text-xs">Sangria</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalSuprimento(true)}
                          className="flex items-center justify-center gap-1 h-9"
                        >
                          <FiPlus size={12} />
                          <span className="text-xs">Suprimento</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalMovimentacoes(true)}
                          className="flex items-center justify-center gap-1 h-9"
                        >
                          <FiEye size={12} />
                          <span className="text-xs">Movimentações</span>
                        </Button>
                        <Button
                          onClick={() => setModalFecharCaixa(true)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 flex items-center justify-center gap-1 h-9"
                        >
                          <FiLock size={12} />
                          <span className="text-xs">Fechar</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="p-4 border-t bg-white sticky bottom-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-xl font-bold text-gray-800">R$ {total.toFixed(2)}</div>
                    </div>
                    <Button 
                      className="w-full py-3 font-bold bg-green-600 hover:bg-green-700 transition-colors"
                      onClick={() => {
                        if (!turnoAtual) {
                          addToast('warning', 'Abra o caixa antes de finalizar vendas!');
                          setModalAbrirCaixa(true);
                          return;
                        }
                        setModalFecharVenda(true);
                      }}
                      disabled={cart.length === 0}
                    >
                      Fechar venda
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Todos os modais do sistema de caixa */}
            <AbrirCaixaModal
              isOpen={modalAbrirCaixa}
              onClose={() => setModalAbrirCaixa(false)}
              onConfirm={abrirCaixa}
              loading={caixaLoading}
              valorTrocoSugerido={valorUltimoFechamento}
            />

            {/* Modal cadastro rápido de cliente */}
            {modalNovoCliente && (
              <Dialog onClose={() => setModalNovoCliente(false)}>
                <div className="p-6 w-full max-w-xl">
                  <h2 className="text-xl font-bold mb-4">Cadastrar Cliente</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Nome</label>
                      <Input value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">CPF/CNPJ</label>
                      <Input value={novoClienteDocumento} onChange={(e) => setNovoClienteDocumento(e.target.value)} placeholder="Documento" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Telefone/WhatsApp</label>
                      <Input value={novoClienteTelefone} onChange={(e) => setNovoClienteTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button variant="secondary" onClick={() => setModalNovoCliente(false)}>Cancelar</Button>
                    <Button
                      onClick={async () => {
                        if (!usuarioData?.empresa_id) return;
                        if (!novoClienteNome.trim()) { addToast('error', 'Informe o nome'); return; }
                        setSalvandoCliente(true);
                        try {
                          const res = await fetch('/api/clientes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              empresaId: usuarioData.empresa_id,
                              nome: novoClienteNome.trim(),
                              documento: novoClienteDocumento.trim(),
                              telefone: novoClienteTelefone.trim(),
                              celular: novoClienteTelefone.trim(),
                              email: ''
                            })
                          });
                          const json = await res.json();
                          if (!res.ok) { addToast('error', json?.error || 'Erro ao cadastrar'); return; }
                          const novo: Cliente = json.cliente;
                          setClientes([novo]);
                          selecionarCliente(novo);
                          addToast('success', 'Cliente cadastrado!');
                          setModalNovoCliente(false);
                        } catch (e) {
                          addToast('error', 'Erro ao cadastrar');
                        } finally {
                          setSalvandoCliente(false);
                        }
                      }}
                      disabled={salvandoCliente}
                    >
                      {salvandoCliente ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </Dialog>
            )}

            {turnoAtual && (
              <FecharCaixaModal
                isOpen={modalFecharCaixa}
                onClose={() => setModalFecharCaixa(false)}
                onConfirm={handleFecharCaixa}
                turno={turnoAtual}
                saldoEsperado={calcularSaldoAtual()}
                loading={caixaLoading}
              />
            )}

            {/* Modal de Sangria */}
            {modalSangria && (
              <Dialog onClose={() => setModalSangria(false)}>
                <div className="p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-red-600">Sangria</h2>
                  <form onSubmit={(e) => { e.preventDefault(); handleSangria(); }}>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        value={valorMovimentacao}
                        onChange={(e) => setValorMovimentacao(e.target.value)}
                        placeholder="Valor"
                        required
                        className="text-right"
                      />
                      <Input
                        type="text"
                        value={descricaoMovimentacao}
                        onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                        placeholder="Descrição"
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => setModalSangria(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Dialog>
            )}

            {/* Modal de Suprimento */}
            {modalSuprimento && (
              <Dialog onClose={() => setModalSuprimento(false)}>
                <div className="p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-blue-600">Suprimento</h2>
                  <form onSubmit={(e) => { e.preventDefault(); handleSuprimento(); }}>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        value={valorMovimentacao}
                        onChange={(e) => setValorMovimentacao(e.target.value)}
                        placeholder="Valor"
                        required
                        className="text-right"
                      />
                      <Input
                        type="text"
                        value={descricaoMovimentacao}
                        onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                        placeholder="Descrição"
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => setModalSuprimento(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Dialog>
            )}

            {/* Modal de Movimentações do Dia */}
            {modalMovimentacoes && (
              <Dialog onClose={() => setModalMovimentacoes(false)}>
                <div className="p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Movimentações do Dia</h2>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sangrias */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FiMinus className="w-5 h-5 text-red-600" />
                          <h3 className="font-semibold text-red-800">Sangrias</h3>
                        </div>
                        <div className="space-y-2">
                          {movimentacoes.filter(m => m.tipo === 'sangria').length > 0 ? (
                            movimentacoes
                              .filter(m => m.tipo === 'sangria')
                              .map(mov => (
                                <div key={mov.id} className="bg-white rounded p-3 border border-red-100">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-red-900">
                                        R$ {mov.valor.toFixed(2)}
                                      </div>
                                      <div className="text-sm text-red-700">
                                        {mov.descricao || 'Sem descrição'}
                                      </div>
                                      <div className="text-xs text-red-500">
                                        {new Date(mov.data_movimentacao).toLocaleString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                    <div className="text-xs text-red-600">
                                      {mov.usuario?.nome || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center text-red-600 py-4">
                              Nenhuma sangria registrada hoje
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="flex justify-between font-semibold text-red-800">
                            <span>Total Sangrias:</span>
                            <span>
                              R$ {movimentacoes
                                .filter(m => m.tipo === 'sangria')
                                .reduce((sum, m) => sum + m.valor, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Suprimentos */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FiPlus className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-800">Suprimentos</h3>
                        </div>
                        <div className="space-y-2">
                          {movimentacoes.filter(m => m.tipo === 'suprimento').length > 0 ? (
                            movimentacoes
                              .filter(m => m.tipo === 'suprimento')
                              .map(mov => (
                                <div key={mov.id} className="bg-white rounded p-3 border border-blue-100">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-blue-900">
                                        R$ {mov.valor.toFixed(2)}
                                      </div>
                                      <div className="text-sm text-blue-700">
                                        {mov.descricao || 'Sem descrição'}
                                      </div>
                                      <div className="text-xs text-blue-500">
                                        {new Date(mov.data_movimentacao).toLocaleString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {mov.usuario?.nome || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center text-blue-600 py-4">
                              Nenhum suprimento registrado hoje
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex justify-between font-semibold text-blue-800">
                            <span>Total Suprimentos:</span>
                            <span>
                              R$ {movimentacoes
                                .filter(m => m.tipo === 'suprimento')
                                .reduce((sum, m) => sum + m.valor, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumo Geral */}
                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Resumo do Turno</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-600">Abertura</div>
                          <div className="text-lg font-bold text-green-600">
                            R$ {turnoAtual?.valor_abertura.toFixed(2) || '0,00'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-600">Vendas</div>
                          <div className="text-lg font-bold text-green-600">
                            R$ {turnoAtual?.valor_vendas.toFixed(2) || '0,00'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-600">Sangrias</div>
                          <div className="text-lg font-bold text-red-600">
                            R$ {turnoAtual?.valor_sangrias.toFixed(2) || '0,00'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-600">Suprimentos</div>
                          <div className="text-lg font-bold text-blue-600">
                            R$ {turnoAtual?.valor_suprimentos.toFixed(2) || '0,00'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Saldo Atual:</span>
                          <span className="text-green-600">
                            R$ {calcularSaldoAtual().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => setModalMovimentacoes(false)}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </Dialog>
            )}

            {/* Modal de fechamento de venda */}
            {modalFecharVenda && (
              <Dialog onClose={() => setModalFecharVenda(false)}>
                <div className="p-6 max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4">Finalizar venda</h2>
                  <div className="mb-4">
                    <div className="font-semibold mb-2">Resumo dos itens</div>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm mb-1">
                        <span>{item.nome} x{item.qty}</span>
                        <span>R$ {(item.preco * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs mb-1">Desconto</label>
                      <Input type="number" min={0} value={descontoModal} onChange={e => setDescontoModal(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs mb-1">Acréscimo</label>
                      <Input type="number" min={0} value={acrescimoModal} onChange={e => setAcrescimoModal(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-2">Forma de pagamento</div>
                    <div className="flex gap-2 mb-2">
                      {['Dinheiro', 'Débito', 'Pix'].map(type => (
                        <Button
                          key={type}
                          variant={paymentType === type ? 'default' : 'secondary'}
                          className="px-4 py-1 rounded-full text-xs"
                          onClick={() => setPaymentType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>R$ {(total - descontoModal + acrescimoModal).toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="secondary" onClick={async () => {
                      const ok = await confirm({
                        title: 'Cancelar venda',
                        message: 'Tem certeza que deseja cancelar esta venda? Os produtos permanecerão no carrinho.',
                        confirmText: 'Sim, cancelar',
                        cancelText: 'Não, continuar'
                      });
                      if (ok) {
                        setModalFecharVenda(false);
                      }
                    }}>Cancelar</Button>
                    <Button className="flex-1" onClick={async () => {
                      setModalFecharVenda(false);
                      await finalizarVenda(descontoModal, acrescimoModal);
                    }}>Confirmar venda</Button>
                  </div>
                </div>
              </Dialog>
            )}

            {/* Modal de impressão de cupom */}
            {modalImprimir && ultimaVenda && (
              <Dialog onClose={() => setModalImprimir(false)}>
                <div className="p-6 max-w-lg w-full">
                  <h2 className="text-xl font-bold mb-4 text-center">Cupom da Venda</h2>
                  
                  <div className="cupom-impressao">
                    <CupomVenda
                      numeroVenda={ultimaVenda.numeroVenda}
                      cliente={ultimaVenda.cliente}
                      produtos={ultimaVenda.produtos}
                      subtotal={ultimaVenda.total - ultimaVenda.acrescimo + ultimaVenda.desconto}
                      desconto={ultimaVenda.desconto}
                      acrescimo={ultimaVenda.acrescimo}
                      total={ultimaVenda.total}
                      formaPagamento={ultimaVenda.pagamento}
                      tipoPedido={orderType}
                      data={ultimaVenda.data}
                      nomeEmpresa={empresaData?.nome || "AgilizaOS"}
                    />
                  </div>

                  <div className="flex gap-2 mt-4 no-print">
                    <Button className="flex-1" variant="secondary" onClick={() => setModalImprimir(false)}>Fechar</Button>
                    <Button className="flex-1" onClick={() => window.print()}>Imprimir</Button>
                  </div>
                </div>
              </Dialog>
            )}
                </div>
              </ConfirmProvider>
            </ToastProvider>
          );
}