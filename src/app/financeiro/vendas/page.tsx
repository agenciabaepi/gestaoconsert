"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MenuLayout from '@/components/MenuLayout';
import { CupomVenda } from '@/components/CupomVenda';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { FiPrinter, FiDollarSign, FiShoppingCart, FiTrendingUp, FiUsers } from 'react-icons/fi';
import ProtectedArea from '@/components/ProtectedArea';

interface VendaItem {
  id: string;
  nome: string;
  preco: number;
  qtd: number;
  codigo_barras?: string;
}

interface Cliente {
  nome: string;
  telefone?: string;
  celular?: string;
  numero_cliente: string;
}

interface Venda {
  id: string;
  numero_venda: number;
  data_venda: string;
  cliente_id: string | null;
  total: number;
  forma_pagamento: string;
  status: string;
  desconto: number;
  acrescimo: number;
  tipo_pedido: string;
  cliente_nome?: string;
  cliente?: Cliente;
  itens?: VendaItem[];
}

interface DashboardMetrics {
  totalVendas: number;
  faturamento: number;
  ticketMedio: number;
  quantidadeVendas: number;
  clientesUnicos: number;
  crescimento: number;
}

type FiltroTipo = 'hoje' | 'semana' | 'mes' | 'personalizado';

export default function ListaVendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendasFiltradas, setVendasFiltradas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalImprimir, setModalImprimir] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [loadingCupom, setLoadingCupom] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVendas: 0,
    faturamento: 0,
    ticketMedio: 0,
    quantidadeVendas: 0,
    clientesUnicos: 0,
    crescimento: 0
  });
  const { empresaData } = useAuth();

  useEffect(() => {
    async function fetchVendas() {
      setLoading(true);
      const { data } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          data_venda, 
          cliente_id, 
          total, 
          forma_pagamento, 
          status, 
          desconto, 
          acrescimo, 
          tipo_pedido,
          cliente:cliente_id(nome, telefone, celular, numero_cliente)
        `)
        .order('data_venda', { ascending: false });
      if (data) {
        setVendas(data.map((v) => ({
          ...v,
          cliente_nome: v.cliente?.nome || '---',
        })));
      }
      setLoading(false);
    }
    fetchVendas();
  }, []);

  useEffect(() => {
    filtrarVendas();
  }, [vendas, filtroAtivo, dataInicio, dataFim]);

  const filtrarVendas = () => {
    let inicio: Date;
    let fim: Date = new Date();

    switch (filtroAtivo) {
      case 'hoje':
        inicio = new Date();
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        inicio = new Date();
        inicio.setDate(inicio.getDate() - inicio.getDay());
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        inicio = new Date();
        inicio.setDate(1);
        inicio.setHours(0, 0, 0, 0);
        fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
        fim.setHours(23, 59, 59, 999);
        break;
      case 'personalizado':
        if (!dataInicio || !dataFim) return;
        inicio = new Date(dataInicio);
        fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    const filtradas = vendas.filter(venda => {
      const dataVenda = new Date(venda.data_venda);
      return dataVenda >= inicio && dataVenda <= fim;
    });

    setVendasFiltradas(filtradas);
    calcularMetricas(filtradas);
  };

  const calcularMetricas = (vendasPeriodo: Venda[]) => {
    const faturamento = vendasPeriodo.reduce((total, venda) => total + venda.total, 0);
    const quantidadeVendas = vendasPeriodo.length;
    const ticketMedio = quantidadeVendas > 0 ? faturamento / quantidadeVendas : 0;
    const clientesUnicos = new Set(vendasPeriodo.filter(v => v.cliente_id).map(v => v.cliente_id)).size;

    // Calcular crescimento (comparar com período anterior)
    let crescimento = 0;
    // Implementar lógica de crescimento se necessário

    setMetrics({
      totalVendas: faturamento,
      faturamento,
      ticketMedio,
      quantidadeVendas,
      clientesUnicos,
      crescimento
    });
  };

  const buscarItensVenda = async (vendaId: string) => {
    setLoadingCupom(true);
    try {
      const { data: venda, error } = await supabase
        .from('vendas')
        .select('produtos')
        .eq('id', vendaId)
        .single();

      if (error) {
        console.error('Erro ao buscar venda:', error);
        return [];
      }

      return venda?.produtos || [];
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return [];
    } finally {
      setLoadingCupom(false);
    }
  };

  const abrirModalImprimir = async (venda: Venda) => {
    const itens = await buscarItensVenda(venda.id);
    setVendaSelecionada({
      ...venda,
      itens
    });
    setModalImprimir(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <ProtectedArea area="vendas">
      <MenuLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Vendas</h1>
        
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {[
              { key: 'hoje', label: 'Hoje' },
              { key: 'semana', label: 'Esta Semana' },
              { key: 'mes', label: 'Este Mês' },
              { key: 'personalizado', label: 'Personalizado' }
            ].map(filtro => (
              <Button
                key={filtro.key}
                variant={filtroAtivo === filtro.key ? 'default' : 'secondary'}
                onClick={() => setFiltroAtivo(filtro.key as FiltroTipo)}
                className="px-4 py-2"
              >
                {filtro.label}
              </Button>
            ))}
          </div>
          
          {filtroAtivo === 'personalizado' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <span>até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FiDollarSign size={24} />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Faturamento</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.faturamento)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiShoppingCart size={24} />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Quantidade</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{metrics.quantidadeVendas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FiTrendingUp size={24} />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.ticketMedio)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <FiUsers size={24} />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Clientes</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{metrics.clientesUnicos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <FiTrendingUp size={24} />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Crescimento</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{metrics.crescimento.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Carregando vendas...</div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="text-center text-gray-500 py-20">Nenhuma venda encontrada no período selecionado.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm">
                    <th className="p-3">#</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Pagamento</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.map(venda => (
                    <tr key={venda.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap font-semibold text-blue-600">#{venda.numero_venda}</td>
                      <td className="p-3 whitespace-nowrap">{new Date(venda.data_venda).toLocaleString('pt-BR')}</td>
                      <td className="p-3 whitespace-nowrap">{venda.cliente_nome}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-green-700">{formatCurrency(venda.total)}</td>
                      <td className="p-3 whitespace-nowrap">{venda.forma_pagamento}</td>
                      <td className="p-3 whitespace-nowrap">{venda.status}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => abrirModalImprimir(venda)}
                          className="flex items-center gap-2"
                        >
                          <FiPrinter size={16} />
                          Cupom
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de impressão de cupom */}
        {modalImprimir && vendaSelecionada && (
          <Dialog onClose={() => setModalImprimir(false)}>
            <div className="p-6 max-w-lg w-full">
              <h2 className="text-xl font-bold mb-4 text-center">Cupom da Venda</h2>
              
              {loadingCupom ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Carregando dados do cupom...</div>
                </div>
              ) : (
                <>
                  <div className="cupom-impressao">
                    <CupomVenda
                      numeroVenda={vendaSelecionada.numero_venda}
                      cliente={vendaSelecionada.cliente}
                      produtos={vendaSelecionada.itens?.map(item => ({
                        id: item.id,
                        nome: item.nome,
                        preco: item.preco,
                        qty: item.qtd
                      })) || []}
                      subtotal={vendaSelecionada.total - vendaSelecionada.acrescimo + vendaSelecionada.desconto}
                      desconto={vendaSelecionada.desconto || 0}
                      acrescimo={vendaSelecionada.acrescimo || 0}
                      total={vendaSelecionada.total}
                      formaPagamento={vendaSelecionada.forma_pagamento}
                      tipoPedido={vendaSelecionada.tipo_pedido || 'Balcão'}
                      data={new Date(vendaSelecionada.data_venda).toLocaleString('pt-BR')}
                      nomeEmpresa={empresaData?.nome || "AgilizaOS"}
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-4 no-print">
                    <Button className="flex-1" variant="secondary" onClick={() => setModalImprimir(false)}>Fechar</Button>
                    <Button className="flex-1" onClick={() => window.print()}>Imprimir</Button>
                  </div>
                </>
              )}
            </div>
          </Dialog>
        )}
      </div>
      </MenuLayout>
    </ProtectedArea>
  );
} 