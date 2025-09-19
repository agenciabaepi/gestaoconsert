'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiUsers, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import DashboardCard from '@/components/ui/DashboardCard';
import MenuLayout from '@/components/MenuLayout';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  celular?: string;
  email?: string;
  documento: string;
  cidade?: string;
  status?: string;
  created_at?: string;
}

export default function ClientesPage() {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Estados para estatísticas
  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesAtivos, setClientesAtivos] = useState(0);
  const [clientesMesAtual, setClientesMesAtual] = useState(0);

  const { empresaData, user } = useAuth();
  const confirm = useConfirm();
  const { addToast } = useToast();

  // Buscar clientes do banco de dados
  useEffect(() => {
    const fetchClientes = async () => {
      if (!empresaData?.id) {
        setCarregando(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', empresaData.id)
          .order('numero_cliente', { ascending: false });

        if (error) {
          console.error("Erro ao buscar clientes:", error.message);
          addToast('error', 'Erro ao carregar clientes do banco de dados');
          setClientes([]);
        } else if (data) {
          setClientes(data);
          
          // Calcular estatísticas
          setTotalClientes(data.length);
          setClientesAtivos(data.filter((c: any) => c.status !== 'inativo').length);
          
          // Clientes do mês atual
          const hoje = new Date();
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          setClientesMesAtual(data.filter((c: any) => {
            if (!c.created_at) return false;
            const dataCliente = new Date(c.created_at);
            return dataCliente >= inicioMes;
          }).length);
        }
      } catch (error) {
        console.error("Erro inesperado ao buscar clientes:", error);
        addToast('error', 'Erro inesperado ao carregar clientes');
        setClientes([]);
      }
      
      setCarregando(false);
    };

    fetchClientes();
  }, [empresaData?.id, addToast]);

  // Otimização: useMemo para clientes filtrados
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) =>
      (statusFiltro ? c.status === statusFiltro : true) &&
      (cidadeFiltro ? c.cidade === cidadeFiltro : true) &&
      (
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.telefone.includes(busca) ||
        (c.celular && c.celular.includes(busca)) ||
        (c.email && c.email.toLowerCase().includes(busca.toLowerCase())) ||
        c.documento.includes(busca)
      )
    );
  }, [clientes, statusFiltro, cidadeFiltro, busca]);

  // Paginação
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clientesPaginados = clientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      addToast('error', 'Erro ao excluir cliente: ' + error.message);
    } else {
      addToast('success', 'Cliente excluído com sucesso!');
      setClientes(clientes.filter(c => c.id !== id));
    }
  }, [clientes, confirm, addToast]);

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
        <div className="px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
              <p className="text-gray-600">Gerencie sua base de clientes</p>
            </div>
            <Link href={`/clientes/novo?atendente=${user?.email || ''}`}>
              <Button className="bg-[#cffb6d] text-black hover:bg-[#b8e55a] shadow-lg">
                <FiPlus size={18} className="mr-2" />
                Novo Cliente
              </Button>
            </Link>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <DashboardCard
              title="Total de Clientes"
              value={totalClientes}
              description="Clientes cadastrados"
              icon={<FiUsers className="w-5 h-5" />}
              svgPolyline={{ color: '#84cc16', points: '0,20 10,15 20,17 30,10 40,12 50,8 60,10 70,6' }}
            />
            <DashboardCard
              title="Clientes Ativos"
              value={clientesAtivos}
              description={`${Math.round((clientesAtivos / totalClientes) * 100) || 0}% do total`}
              descriptionColorClass="text-green-600"
              icon={<FiUsers className="w-5 h-5" />}
              svgPolyline={{ color: '#22c55e', points: '0,15 10,12 20,8 30,14 40,6 50,10 60,4 70,2' }}
            />
            <DashboardCard
              title="Novos Este Mês"
              value={clientesMesAtual}
              description="Cadastrados no mês"
              icon={<FiPlus className="w-5 h-5" />}
              svgPolyline={{ color: '#8b5cf6', points: '0,18 10,20 20,14 30,16 40,10 50,12 60,8 70,6' }}
            />
          </div>
          
          {/* Filtros e Ações */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <select
                  value={cidadeFiltro}
                  onChange={(e) => setCidadeFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as cidades</option>
                  {[...new Set(clientes.map(c => c.cidade).filter(Boolean))].map(cidade => (
                    <option key={cidade} value={cidade}>{cidade}</option>
                  ))}
                </select>
              </div>
              <div>
                <Button
                  onClick={exportarCSV}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <FiDownload size={16} className="mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Clientes ({clientesFiltrados.length})
              </h3>
            </div>

            {carregando ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#cffb6d] mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">Carregando clientes...</p>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {clientes.length === 0 
                    ? 'Comece cadastrando seu primeiro cliente' 
                    : 'Tente ajustar os filtros para encontrar o que procura'
                  }
                </p>
                {clientes.length === 0 && (
                  <Link href={`/clientes/novo?atendente=${user?.email || ''}`}>
                    <Button className="bg-[#cffb6d] text-black hover:bg-[#b8e55a]">
                      <FiPlus size={16} className="mr-2" />
                      Cadastrar Primeiro Cliente
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Nome</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Telefone</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Cidade</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPaginados.map((cliente, idx) => (
                    <tr
                      key={cliente.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-xs text-gray-500">{cliente.documento}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{cliente.telefone}</div>
                        {cliente.celular && <div className="text-xs text-gray-500">{cliente.celular}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{cliente.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{cliente.cidade || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.status || 'ativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link href={`/clientes/${cliente.id}`}>
                          <button type="button" className="text-blue-600 hover:text-blue-800">
                            <FiEye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/clientes/${cliente.id}/editar`}>
                          <button type="button" className="text-gray-600 hover:text-black">
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button 
                          type="button" 
                          onClick={() => handleExcluir(cliente.id, cliente.nome)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
      </div>
    </MenuLayout>
  );
}
