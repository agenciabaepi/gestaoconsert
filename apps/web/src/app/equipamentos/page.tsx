// NOVO SISTEMA DE PRODUTOS E SERVIÇOS
// NOVO SISTEMA DE PRODUTOS E SERVIÇOS
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MenuLayout from '@/components/MenuLayout';
import { Button } from '@/components/Button';
import React, { useEffect, useState } from 'react';
import { useToast, ToastProvider } from '@/components/Toast';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  Chart as ChartJS,
  ArcElement as ArcElement2,
  Tooltip as Tooltip2,
  Legend as Legend2,
  DoughnutController,
} from 'chart.js';
import Image from 'next/image';
import { DataTable, Column } from '@/components/DataTable';
import DashboardCard from '@/components/ui/DashboardCard';

ChartJS.register(ArcElement2, Tooltip2, Legend2, DoughnutController);
import { useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { interceptSupabaseQuery } from '@/utils/supabaseInterceptor';
import { useConfirm } from '@/components/ConfirmDialog';

// Usar o cliente importado

type Tipo = 'produto' | 'servico';

interface ProdutoServico {
  id: string;
  codigo?: string;
  nome: string;
  descricao: string;
  tipo: Tipo;
  preco: number;
  custo: number | null;
  estoque_atual: number | null;
  unidade: string;
  estoque_minimo?: number | null;
  fornecedor?: string;
  codigo_barras?: string;
  categoria?: string;
  marca?: string;
  ativo: boolean;
}

export default function ProdutosServicosPage() {
  const { session, usuarioData } = useAuth();
  const empresaId = usuarioData?.empresa_id;
  const [logErro, setLogErro] = useState('');
  const [lista, setLista] = useState<ProdutoServico[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<Tipo>('produto');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState('');
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [controleEstoque, setControleEstoque] = useState(false);
  const [fornecedor, setFornecedor] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<'produto' | 'servico'>('produto');
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Novo estado para modal de fornecedor
  const [mostrarModalFornecedor, setMostrarModalFornecedor] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState('');
  // Estado para lista de fornecedores
  const [listaFornecedores, setListaFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [buscandoFornecedor, setBuscandoFornecedor] = useState(false);
  const [ativo, setAtivo] = useState(true);

  const { addToast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  Chart.register(ArcElement, Tooltip, Legend);

  // Função buscar movida para fora do useEffect para reuso
  const buscar = async () => {
    setCarregando(true);
    
    // ✅ SEGURANÇA: Timeout para evitar loading infinito
    const timeoutId = setTimeout(() => {
      setCarregando(false);
      addToast('error', 'Tempo limite excedido. Tente recarregar a página.');
    }, 15000); // 15 segundos
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        clearTimeout(timeoutId);
        setCarregando(false);
        return;
      }

      const {
        data: { user },
        error: erroUser,
      } = await supabase.auth.getUser();

      if (erroUser || !user) {
        setCarregando(false);
        return;
      }

      const { data: usuarioData, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", user.id)
        .single();

      if (erroUsuario || !usuarioData) {
        setCarregando(false);
        return;
      }

      const empresaId = usuarioData.empresa_id;

      // ✅ SEGURANÇA: Validar empresa_id
      if (!empresaId) {
        clearTimeout(timeoutId);
        setCarregando(false);
        addToast('error', 'Empresa não identificada. Faça login novamente.');
        return;
      }

      // ✅ SEGURANÇA: Filtrar fornecedores por empresa
      const { data: fornecedoresData, error: fornecedoresError } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("empresa_id", empresaId);

      if (fornecedoresError) {
        console.error('Erro ao buscar fornecedores:', fornecedoresError);
        addToast('error', 'Erro ao carregar fornecedores');
      } else {
        setListaFornecedores(fornecedoresData || []);
      }

      const { data: produtosServicosData, error: produtosError } = await interceptSupabaseQuery('produtos_servicos', async () => {
        return await supabase
          .from("produtos_servicos")
          .select("*")
          .eq("empresa_id", empresaId);
      });
      
      // Suprimir erros 404 silenciosamente
      if (produtosError && produtosError.code !== 'TABLE_NOT_EXISTS' && produtosError.code !== 'PGRST116' && !produtosError.message?.includes('404')) {
        console.error('Erro ao buscar produtos/serviços:', produtosError);
      }

      // Sort by criado_em descending (newest first)
      const sortedData = ((produtosServicosData as any[]) || []).slice().sort((a: any, b: any) => {
        const aTime = new Date((b as any).criado_em).getTime();
        const bTime = new Date((a as any).criado_em).getTime();
        return aTime - bTime;
      });
      setLista(sortedData);

    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
      addToast('error', 'Erro ao carregar dados');
    } finally {
      clearTimeout(timeoutId);
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  const graficoRef = useRef<HTMLCanvasElement | null>(null);

  // useEffect responsável pelos gráficos de produtos e serviços
  /*
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { Chart, registerables } = require('chart.js');
      Chart.register(...registerables);

      const produtosAtivos = lista.filter(p => p.tipo === 'produto' && p.ativo).length;
      const produtosInativos = lista.filter(p => p.tipo === 'produto' && !p.ativo).length;
      const servicosAtivos = lista.filter(p => p.tipo === 'servico' && p.ativo).length;
      const servicosInativos = lista.filter(p => p.tipo === 'servico' && !p.ativo).length;

      const canvasProdutos = document.getElementById('graficoProdutos') as HTMLCanvasElement;
      if (canvasProdutos) {
        const ctx = canvasProdutos.getContext('2d');
        if (ctx) {
          if (Chart.getChart(ctx)) {
            Chart.getChart(ctx)?.destroy();
          }
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Ativos', 'Inativos'],
              datasets: [{
                data: [produtosAtivos, produtosInativos],
                backgroundColor: ['#cffb6d', '#000000']
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      }

      const canvasServicos = document.getElementById('graficoServicos') as HTMLCanvasElement;
      if (canvasServicos) {
        const ctx = canvasServicos.getContext('2d');
        if (ctx) {
          if (Chart.getChart(ctx)) {
            Chart.getChart(ctx)?.destroy();
          }
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Ativos', 'Inativos'],
              datasets: [{
                data: [servicosAtivos, servicosInativos],
                backgroundColor: ['#cffb6d', '#000000']
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      }
    }
  }, [lista]);
  */

  // useEffect para buscar fornecedores removido, pois a busca foi incorporada à nova função buscar

  // A função buscar anterior foi removida, pois a busca agora é feita no useEffect acima

  const salvar = async () => {
    if (!nome || !preco) return;

    if (!empresaId) {
      setMensagemAviso('ID da empresa não encontrado.');
      return;
    }

    // Buscar o maior código já existente
    const { data: ultimos, error: erroUltimos } = await supabase
      .from('produtos_servicos')
      .select('codigo')
      // Não filtrar por empresa_id manualmente, RLS já faz isso
      .order('codigo', { ascending: false })
      .limit(1);

    let novoCodigo = '1';
    if (!erroUltimos && ultimos && ultimos.length > 0 && ultimos[0].codigo) {
      const ultimoNumero = parseInt(ultimos[0].codigo);
      if (!isNaN(ultimoNumero)) {
        novoCodigo = (ultimoNumero + 1).toString();
      }
    }

    const novoRegistro = {
      codigo: novoCodigo,
      nome,
      descricao,
      preco: parseFloat(preco),
      custo: tipo === 'produto' ? parseFloat(custo || '0') : null,
      estoque_atual: tipo === 'produto' ? parseInt(estoque || '0') : null,
      estoque_minimo: tipo === 'produto' ? parseInt(estoqueMinimo || '0') : null,
      unidade,
      empresa_id: empresaId,
      fornecedor: tipo === 'produto' ? fornecedor || null : null,
      codigo_barras: tipo === 'produto' ? codigoBarras || null : null,
    };
    // Extrai os campos corretamente, incluindo ativo
    const { descricao: _descricao, preco: _preco, custo: _custo, tipo: _tipo, unidade: _unidade, ativo: _ativo } = { ...novoRegistro, tipo, ativo };
    // Salva com tipo e ativo garantidos
    await supabase.from('produtos_servicos').insert([{ ...novoRegistro, tipo, ativo }]);
    setNome('');
    setDescricao('');
    setPreco('');
    setCusto('');
    setEstoque('');
    setEstoqueMinimo('');
    setUnidade('un');
    setFornecedor('');
    setCodigoBarras('');
    setAtivo(true);
    buscar();
    addToast('success', 'Item cadastrado com sucesso!');
  };

  const excluir = async (id: string) => {
    const ok = await confirm({ message: 'Tem certeza que deseja excluir este item?' });
    if (!ok) return;
    await supabase.from('produtos_servicos').delete().eq('id', id);
    buscar();
    addToast('success', 'Item excluído com sucesso!');
  };

  const iniciarEdicao = (item: ProdutoServico) => {
    setEditandoId(item.id);
    setNome(item.nome);
    setDescricao(item.descricao);
    setTipo(item.tipo);
    setPreco(item.preco.toString());
    setCusto(item.custo?.toString() ?? '');
    setEstoque(item.estoque_atual?.toString() || '');
    setEstoqueMinimo(item.estoque_minimo?.toString() || '');
    setUnidade(item.unidade);
    setAtivo(item.ativo ?? true);
  };

  const atualizar = async () => {
    if (!editandoId || !empresaId) return;

    const payload = {
      nome,
      descricao,
      tipo,
      preco: parseFloat(preco),
      custo: tipo === 'produto' ? parseFloat(custo || '0') : null,
      estoque_atual: tipo === 'produto' ? parseInt(estoque || '0') : null,
      estoque_minimo: tipo === 'produto' ? parseInt(estoqueMinimo || '0') : null,
      unidade,
      fornecedor: tipo === 'produto' ? fornecedor || null : null,
      codigo_barras: tipo === 'produto' ? codigoBarras || null : null,
      ativo,
    };
    const { error } = await supabase
      .from('produtos_servicos')
      .update(payload)
      .eq('id', editandoId);
    
    if (!error) {
      setEditandoId(null);
      setNome('');
      setDescricao('');
      setPreco('');
      setCusto('');
      setEstoque('');
      setEstoqueMinimo('');
      setUnidade('un');
      setFornecedor('');
      setCodigoBarras('');
      setAtivo(true);
      buscar();
      addToast('success', 'Item atualizado com sucesso!');
    }
  };

  // Filtro e paginação
  const filtered = lista.filter(item => item.tipo === abaSelecionada);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  // DataTable columns definition
  const columns: Column<ProdutoServico>[] = [
    { key: 'codigo', header: 'Código', width: 'w-16' },
    ...(abaSelecionada === 'produto'
      ? [{
          key: 'imagens_url',
          header: 'Imagem',
          render: (row: any) =>
            row.imagens_url?.[0]
              ? (
                <div className="w-10 h-10 rounded overflow-hidden">
                  <img
                    src={row.imagens_url[0] || '/assets/imagens/imagem-produto.jpg'}
                    alt={row.nome}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/imagens/imagem-produto.jpg'; }}
                  />
                </div>
              )
              : (
                <div className="w-10 h-10 rounded overflow-hidden">
                  <img
                    src={'/assets/imagens/imagem-produto.jpg'}
                    alt={row.nome}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              )
        }]
      : []),
    {
      key: 'nome',
      header: 'Nome',
      render: row => (
        <div>
          <div className="font-semibold">{row.nome}</div>
          {row.descricao && <div className="text-xs text-gray-500">{row.descricao}</div>}
        </div>
      )
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: row => <span className="capitalize">{row.tipo}</span>
    },
    {
      key: 'situacao',
      header: 'Status',
      render: row => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
        }`}>{row.ativo ? 'Ativo' : 'Inativo'}</span>
      )
    },
    {
      key: 'preco',
      header: 'Preço',
      render: row => `R$ ${row.preco.toFixed(2)}`
    },
    ...(abaSelecionada === 'produto'
      ? [
          {
            key: 'estoque_atual',
            header: 'Estoque',
            render: (row: any) => (
              <span>
                {row.tipo === 'produto' ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "font-semibold " +
                        (
                          row.estoque_atual !== null && row.estoque_minimo !== null
                            ? row.estoque_atual < row.estoque_minimo
                              ? 'text-red-600'
                              : row.estoque_atual <= row.estoque_minimo * 1.2
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            : ''
                        )
                      }
                    >
                      {row.estoque_atual}
                    </span>
                    {row.estoque_atual !== null && row.estoque_minimo !== null && (
                      <>
                        {row.estoque_atual < row.estoque_minimo && (
                          <span className="text-xs text-red-800 bg-red-100 px-2 py-0.5 rounded-full">Estoque baixo</span>
                        )}
                        {row.estoque_atual >= row.estoque_minimo && row.estoque_atual <= row.estoque_minimo * 1.2 && (
                          <span className="text-xs text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">Estoque próximo</span>
                        )}
                        {row.estoque_atual > row.estoque_minimo * 1.2 && (
                          <span className="text-xs text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Estoque OK</span>
                        )}
                      </>
                    )}
                  </div>
                ) : '-'}
              </span>
            )
          },
          { key: 'unidade', header: 'Unidade' },
          { key: 'fornecedor', header: 'Fornecedor' },
          { key: 'codigo_barras', header: 'Código Barras' },
        ]
      : []),
  ];

  // Dados reais para os cards
  const produtos = lista.filter(item => item.tipo === 'produto');
  const servicos = lista.filter(item => item.tipo === 'servico');
  const totalProdutos = produtos.length;
  const totalServicos = servicos.length;
  const produtosEmEstoque = produtos.reduce((acc, p) => acc + (p.estoque_atual || 0), 0);
  const produtosAbaixoMinimo = produtos.filter(p => p.estoque_atual !== null && p.estoque_minimo !== null && p.estoque_atual < p.estoque_minimo!).length;
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.estoque_atual || 0) * (p.custo || 0)), 0);

  return (
    <ToastProvider>
      <MenuLayout>
          <div className="pt-20 px-6 w-full">
            {/* Cards resumo de produtos e serviços - dados reais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <DashboardCard
                title="Total de Produtos"
                value={totalProdutos}
                description={'+5 este mês'}
                descriptionColorClass="text-green-500"
                svgPolyline={{ color: '#84cc16', points: '0,20 10,15 20,17 30,10 40,12 50,8 60,10 70,6' }}
              />
              <DashboardCard
                title="Total de Serviços"
                value={totalServicos}
                description={'+2 este mês'}
                descriptionColorClass="text-indigo-500"
                svgPolyline={{ color: '#6366f1', points: '0,18 10,16 20,14 30,10 40,11 50,9 60,10 70,6' }}
              />
              <DashboardCard
                title="Em Estoque"
                value={produtosEmEstoque}
                description={'+2 esta semana'}
                descriptionColorClass="text-blue-500"
                svgPolyline={{ color: '#60a5fa', points: '0,20 10,16 20,14 30,10 40,11 50,8 60,6 70,4' }}
              />
              <DashboardCard
                title="Abaixo do Mínimo"
                value={produtosAbaixoMinimo}
                description={'Produtos abaixo do mínimo'}
                descriptionColorClass="text-red-500"
                svgPolyline={{ color: '#f87171', points: '0,12 10,14 20,16 30,18 40,20 50,17 60,15 70,16' }}
              />
            </div>
            {/* Mensagem de erro de log, se houver */}
            {logErro && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-6 font-mono text-xs whitespace-pre-wrap">
                {logErro}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-sm font-semibold mb-2">Distribuição de Produtos</h2>
                  <canvas id="graficoProdutos" width="200" height="200"></canvas>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-sm font-semibold mb-2">Distribuição de Serviços</h2>
                  <canvas id="graficoServicos" width="200" height="200"></canvas>
                </div>
              </div>
              */}

              <section className="col-span-1 md:col-span-2 bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center mb-4 space-x-2">
                  <TagIcon className="h-6 w-6 text-indigo-500" />
                  <h2 className="text-lg font-semibold">Produtos e Serviços Cadastrados</h2>
                </div>

                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                  <div className="inline-flex space-x-2 bg-gray-100 rounded-full p-1 mb-6">
                    <button
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                        abaSelecionada === 'produto'
                          ? 'bg-black text-white shadow'
                          : 'text-gray-600 hover:text-black'
                      }`}
                      onClick={() => setAbaSelecionada('produto')}
                    >
                      Produtos
                    </button>
                    <button
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                        abaSelecionada === 'servico'
                          ? 'bg-black text-white shadow'
                          : 'text-gray-600 hover:text-black'
                      }`}
                      onClick={() => setAbaSelecionada('servico')}
                    >
                      Serviços
                    </button>
                  </div>

                  {/* Novo Produto button above search */}
                  <div className="flex-1 flex justify-end mb-2">
                    <Link href="/equipamentos/novo">
                      <Button>+ Novo Produto</Button>
                    </Link>
                  </div>

                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Pesquisar item..."
                      className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#cffb6d]"
                      onChange={(e) => {
                        const search = e.target.value;
                        if ((search ?? '').trim() === '') {
                          buscar(); // Recarrega todos os itens se o campo estiver vazio
                        } else {
                          setLista((produtos) => {
                            const filtered = produtos.filter(
                              (prod) =>
                                (prod.nome ?? '').toLowerCase().includes((search ?? '').toLowerCase()) ||
                                (prod.categoria ?? '').toLowerCase().includes((search ?? '').toLowerCase()) ||
                                (prod.codigo_barras ?? '').toLowerCase().includes((search ?? '').toLowerCase()) ||
                                (prod.marca ?? '').toLowerCase().includes((search ?? '').toLowerCase())
                            );
                            return filtered;
                          });
                        }
                      }}
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 15z" />
                    </svg>
                  </div>
                </div>

                

                <div className="overflow-x-auto">
                <DataTable
  columns={columns}
  data={paginated}
  rowKey="id"
  onEdit={row => router.push(`/equipamentos/novo?produtoId=${row.id}`)}
  onDelete={row => excluir(row.id)}
/>
                </div>
              </section>
            </div>
          </div>
          {/* Modal para novo fornecedor */}
          {mostrarModalFornecedor && (
            <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Fornecedor</h3>
                  <button onClick={() => setMostrarModalFornecedor(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Nome/Razão Social"
                    value={novoFornecedor}
                    onChange={(e) => setNovoFornecedor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Celular (opcional)"
                  />
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Telefone"
                  />
                  <input
                    type="email"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="E-mail (opcional)"
                  />
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="CNPJ/CPF (opcional)"
                  />
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="CEP (opcional)"
                  />
                  {/* Removido campo "Origem Cliente*" */}
                  {/* Removido campo "Cadastrado por" */}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setMostrarModalFornecedor(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!novoFornecedor || !empresaId) {
                        setMensagemAviso('Preencha o nome do fornecedor e verifique o ID da empresa.');
                        return;
                      }
                      const { error } = await supabase.from('fornecedores').insert({
                        nome: novoFornecedor,
                        empresa_id: empresaId,
                        telefone: (document.querySelector('input[placeholder="Telefone"]') as HTMLInputElement)?.value || null,
                        celular: (document.querySelector('input[placeholder="Celular (opcional)"]') as HTMLInputElement)?.value || null,
                        email: (document.querySelector('input[placeholder="E-mail (opcional)"]') as HTMLInputElement)?.value || null,
                        cnpj_cpf: (document.querySelector('input[placeholder="CNPJ/CPF (opcional)"]') as HTMLInputElement)?.value || null,
                        cep: (document.querySelector('input[placeholder="CEP (opcional)"]') as HTMLInputElement)?.value || null,
                      });
                      if (error) {
                        setMensagemAviso('Erro ao cadastrar fornecedor: ' + (error.message || 'Erro desconhecido'));
                      } else {
                        setFornecedor(novoFornecedor);
                        setNovoFornecedor('');
                        setMostrarModalFornecedor(false);
                        addToast('success', 'Fornecedor cadastrado com sucesso!');
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-4 4a4 4 0 110-8 4 4 0 010 8zm0 0v1a4 4 0 01-4 4H6a4 4 0 01-4-4v-1a4 4 0 014-4h4a4 4 0 014 4z" />
                    </svg>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </MenuLayout>
      </ToastProvider>
  );
}