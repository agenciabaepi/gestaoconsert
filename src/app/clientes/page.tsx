'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { FiUsers, FiCalendar, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { FiAlertTriangle } from 'react-icons/fi';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { Cliente } from '@/types/cliente';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import { Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useConfirm } from '@/components/ConfirmDialog';

import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';


export default function ClientesPage() {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  // Ordem fixa por padrão: numero_cliente descendente
  // const [ordenarPor, setOrdenarPor] = useState('created_at');
  // const [ordemAscendente, setOrdemAscendente] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const limite = 10; // Número de clientes por página
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesMesAtual, setClientesMesAtual] = useState(0);
  const [clientesUltimos7Dias, setClientesUltimos7Dias] = useState(0);

  const series = [totalClientes, clientesMesAtual, clientesUltimos7Dias];

  const optionsPizza = {
    chart: {
      type: 'donut',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600
            }
          }
        }
      }
    },
    labels: ['Total', 'Este mês', 'Últimos 7 dias'],
    colors: ['#6366F1', '#10B981', '#F59E0B'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  const confirm = useConfirm();

  // Novos estados para modal de exclusão em massa
  const [modalExclusaoMassaOpen, setModalExclusaoMassaOpen] = useState(false);
  const [confirmarExclusaoMassa, setConfirmarExclusaoMassa] = useState(() => () => {});

  const router = useRouter();

  const { empresaData, usuario } = useAuth();
  const { carregarLimites, limites, podeCriar, assinatura, isTrialExpired } = useSubscription();

  // Verificar se está no trial e não pode criar clientes
  const isTrial = assinatura?.status === 'trial' && !isTrialExpired();
  const cannotCreateClients = isTrial && limites && !podeCriar('clientes');


  useEffect(() => {
    const fetchClientes = async () => {
      if (!empresaData?.id) return;

      // --- Adicionado: mostrar sessão e UID no console
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      console.log('🧪 SESSION:', session);
      console.log('🔐 USER ID:', session?.user?.id);
      // ---

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .order('numero_cliente', { ascending: false });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
      } else {
        setClientes(data);
        console.log("Total de clientes encontrados:", data.length);
      }
      setCarregando(false);
    };

    fetchClientes();
  }, [empresaData?.id]);

  // Otimização: useMemo para clientes filtrados
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) =>
      (statusFiltro ? c.status === statusFiltro : true) &&
      (cidadeFiltro ? c.cidade === cidadeFiltro : true) &&
      (
        dataFiltro
          ? new Date(c.created_at) >= new Date(Date.now() - Number(dataFiltro) * 24 * 60 * 60 * 1000)
          : true
      ) &&
      (
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.telefone.includes(busca) ||
        c.celular.includes(busca) ||
        c.email.toLowerCase().includes(busca.toLowerCase()) ||
        c.documento.includes(busca)
      )
    );
  }, [clientes, statusFiltro, cidadeFiltro, dataFiltro, busca]);

  // Otimização: useMemo para cidades únicas
  const cidadesUnicas = useMemo(() => {
    return [...new Set(clientes.map(c => c.cidade).filter(Boolean))];
  }, [clientes]);

  // Otimização: useCallback para handlers
  const handleBuscaChange = useCallback((value: string) => {
    setBusca(value);
    setPaginaAtual(1);
  }, []);

  const handleStatusFiltroChange = useCallback((value: string) => {
    setStatusFiltro(value);
    setPaginaAtual(1);
  }, []);

  const handleCidadeFiltroChange = useCallback((value: string) => {
    setCidadeFiltro(value);
    setPaginaAtual(1);
  }, []);

  const handleDataFiltroChange = useCallback((value: string) => {
    setDataFiltro(value);
    setPaginaAtual(1);
  }, []);

  const handleExcluir = useCallback(async (id: string, nome: string) => {
    const ok = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o cliente ${nome}?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    if (!ok) return;
    
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    } else {
      toast.success('Cliente excluído com sucesso!');
      setClientes(clientes.filter(c => c.id !== id));
    }
  }, [clientes, confirm, toast]);

  // Função para exportar os clientes filtrados para CSV
  const exportarCSV = () => {
    const cabecalho = 'Nome,Telefone,Celular,Email,Documento\n';
    const linhas = clientesFiltrados.map(c =>
      `${c.nome},${c.telefone},${c.celular},${c.email},${c.documento}`
    ).join('\n');

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'clientes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MenuLayout>
      <ProtectedArea area="clientes">
        <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
        {!cannotCreateClients && (
          <Link
            href={`/clientes/novo?atendente=${usuario?.nome || ''}`}
            className="flex items-center gap-2 bg-[#cffb6d] text-black shadow-lg px-4 py-2 rounded-md hover:bg-[#e5ffa1] backdrop-blur-md"
          >
            <FiPlus className="w-6 h-6" />
            Novo Cliente
          </Link>
        )}
      </div>

      {/* Aviso único quando limite for atingido */}
      {cannotCreateClients && (
        <div className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-700 font-medium text-sm">
              Limite de clientes atingido
            </span>
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Para criar mais clientes, escolha um plano adequado às suas necessidades.
          </p>
          <button 
            onClick={() => window.location.href = '/planos'}
            className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            Ver planos disponíveis
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {/* Ordenação removida/fixada em numero_cliente desc */}
        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1">
          <option value="">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        <select value={cidadeFiltro} onChange={(e) => setCidadeFiltro(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1">
          <option value="">Todas as Cidades</option>
          <option value="São Paulo">São Paulo</option>
          <option value="Rio de Janeiro">Rio de Janeiro</option>
          <option value="Belo Horizonte">Belo Horizonte</option>
        </select>
        <select value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1">
          <option value="">Todas as Datas</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
      </div>

      {selecionados.length > 0 && (
        <div className="flex justify-end gap-2 mb-4 text-sm">
          <button 
            onClick={() => console.log('Exportar selecionados')} 
            className="px-3 py-1 bg-white/10 text-white rounded-md hover:bg-white/20 transition backdrop-blur-md"
          >
            Exportar Selecionados
          </button>
          <button 
            onClick={exportarCSV} 
            className="px-3 py-1 bg-[#cffb6d]/80 text-black rounded-md hover:bg-[#d8ffa0]/90 transition backdrop-blur-md"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setModalExclusaoMassaOpen(true)}
            className="px-3 py-1 bg-red-600/80 text-white rounded-md hover:bg-red-700/90 transition backdrop-blur-md"
          >
            Excluir Selecionados
          </button>
          <button 
            onClick={() => setSelecionados([])} 
            className="px-3 py-1 bg-white/10 text-white rounded-md hover:bg-white/20 transition backdrop-blur-md"
          >
            Limpar Seleção
          </button>
        </div>
      )}

      {carregando ? (
        <div className="bg-white shadow rounded-lg px-6 py-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Celular</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Status</th>
                <th>Data Cadastro</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-1 py-4"><Skeleton width={18} height={18} /></td>
                  <td className="px-1 py-4"><Skeleton width={30} height={14} /></td>
                  <td className="px-1 py-4"><Skeleton width={100} height={14} /></td>
                  <td className="px-1 py-4"><Skeleton width={100} height={14} /></td>
                  <td className="px-1 py-4"><Skeleton width={160} height={14} /></td>
                  <td className="px-1 py-4"><Skeleton width={100} height={14} /></td>
                  <td className="px-1 py-4"><Skeleton width={50} height={18} /></td>
                  <td className="px-1 py-4"><Skeleton width={80} height={14} /></td>
                  <td className="px-1 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Skeleton width={18} height={18} />
                      <Skeleton width={18} height={18} />
                      <Skeleton width={18} height={18} />
                      <Skeleton width={18} height={18} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg px-4 py-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="relative z-10 align-middle py-3 sticky top-0 z-10 bg-white">
                  <input type="checkbox" onChange={(e) => setSelecionados(e.target.checked ? clientesFiltrados.map(c => c.id) : [])} />
                </th>
                <th className="px-1 py-3 sticky left-0 bg-gray-100 z-10 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">#</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Nome</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Telefone</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">WhatsApp</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Email</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Documento</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Cadastrado por</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Status</th>
                <th className="px-1 py-3 text-sm text-left font-semibold text-gray-700 sticky top-0 z-10 bg-white">Data Cadastro</th>
                <th className="px-1 py-3 text-sm text-right font-semibold text-gray-700 sticky top-0 z-10 bg-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-transform transform hover:scale-[1.005] border-b border-gray-100`}
                >
                  <td className="relative z-10 align-middle py-4">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelecionados([...selecionados, c.id]);
                        else setSelecionados(selecionados.filter(id => id !== c.id));
                      }}
                    />
                  </td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.numero_cliente}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.nome}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.telefone}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.celular}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.email}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.documento}</td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{c.cadastrado_por || '—'}</td>
                  <td className="px-1 py-4 align-middle">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      c.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      c.status === 'inativo' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-1 py-4 font-medium text-gray-700 text-sm align-middle">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-1 py-4 flex justify-end gap-3 align-middle">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-blue-600"
                      title="Visualizar cliente"
                    >
                      <FiEye className="w-5 h-5 hover:text-gray-700" />
                    </Link>
                    <Link
                      href={`/clientes/${c.id}/editar`}
                      className="text-yellow-600"
                      title="Editar cliente"
                    >
                      <FiEdit2 className="w-5 h-5 hover:text-gray-700" />
                    </Link>
                    <button
                      className="text-red-600 hover:scale-110 transform transition"
                      onClick={() => handleExcluir(c.id, c.nome)}
                      title="Excluir cliente"
                    >
                      <FiTrash2 className="w-5 h-5 hover:text-gray-700" />
                    </button>
                    <a
                      href={`https://wa.me/${c.celular?.replace(/\D/g, '') || c.telefone?.replace(/\D/g, '') || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:scale-110 transform transition"
                      aria-label={`Enviar mensagem para ${c.nome}`}
                      title="Enviar WhatsApp"
                    >
                      <FaWhatsapp className="w-5 h-5 hover:text-gray-700" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Paginação */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaAtual === 1}
          className={`px-3 py-1 rounded transition backdrop-blur-md ${
            paginaAtual === 1
              ? 'bg-[#f0ffd0] text-gray-400 cursor-not-allowed'
              : 'bg-[#cffb6d]/10 text-[#cffb6d] hover:bg-[#cffb6d]/20'
          }`}
        >
          Anterior
        </button>
        <span className="px-3 py-1 text-black font-semibold">{paginaAtual} de {totalPaginas}</span>
        <button
          onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaAtual === totalPaginas}
          className={`px-3 py-1 rounded transition backdrop-blur-md ${
            paginaAtual === totalPaginas
              ? 'bg-[#f0ffd0] text-gray-400 cursor-not-allowed'
              : 'bg-[#cffb6d]/10 text-[#cffb6d] hover:bg-[#cffb6d]/20'
          }`}
        >
          Próximo
        </button>
      </div>

      {/* Gráfico de Pizza - Resumo de Clientes em 3 Cards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Resumo de Clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-[#cffb6d] p-4 min-h-[280px] flex flex-col justify-center items-center gap-2">
            <FiUsers size={20} className="text-black" />
            <h3 className="text-md font-semibold text-center text-black">Total</h3>
            {totalClientes > 0 ? (
              <Chart
                options={{ ...optionsPizza, labels: ['Total'], colors: ['#1e3bef'] }}
                series={[totalClientes]}
                type="donut"
                width={220}
                height={220}
              />
            ) : (
              <p className="text-gray-400 mt-4">Sem dados</p>
            )}
          </div>
          <div className="bg-white rounded-lg border border-[#cffb6d] p-4 min-h-[280px] flex flex-col justify-center items-center gap-2">
            <FiCalendar size={20} className="text-black" />
            <h3 className="text-md font-semibold text-center text-black">Este mês</h3>
            {clientesMesAtual > 0 ? (
              <Chart
                options={{ ...optionsPizza, labels: ['Este mês'], colors: ['#10B981'] }}
                series={[clientesMesAtual]}
                type="donut"
                width={220}
                height={220}
              />
            ) : (
              <p className="text-gray-400 mt-4">Sem dados</p>
            )}
          </div>
          <div className="bg-white rounded-lg border border-[#cffb6d] p-4 min-h-[280px] flex flex-col justify-center items-center gap-2">
            <FiClock size={20} className="text-black" />
            <h3 className="text-md font-semibold text-center text-black">Últimos 7 dias</h3>
            {clientesUltimos7Dias > 0 ? (
              <Chart
                options={{ ...optionsPizza, labels: ['Últimos 7 dias'], colors: ['#F59E0B'] }}
                series={[clientesUltimos7Dias]}
                type="donut"
                width={220}
                height={220}
              />
            ) : (
              <p className="text-gray-400 mt-4">Sem dados</p>
            )}
          </div>
        </div>
      </div>


        <ToastContainer 
          position="bottom-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          transition={Slide}
          theme="colored"
        />
        
        {/* Modal para exclusão em massa */}
      </div>
    </ProtectedArea>
    </MenuLayout>
  );
}
// O botão "Excluir Selecionados" permite a exclusão em massa dos clientes marcados na lista.
// Ao ser acionado, remove os clientes selecionados do banco, atualiza a lista exibida e limpa a seleção.