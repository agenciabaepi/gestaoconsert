'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';

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

  const { empresaData, user } = useAuth();
  const confirm = useConfirm();
  const { addToast } = useToast();

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
      <ProtectedArea area="clientes">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
            <Link
              href={`/clientes/novo?atendente=${user?.email || ''}`}
              className="flex items-center gap-2 bg-[#cffb6d] text-black shadow-lg px-4 py-2 rounded-md hover:bg-[#e5ffa1] backdrop-blur-md"
            >
              <FiPlus size={18} />
              Novo Cliente
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p>Lista de clientes será exibida aqui</p>
          </div>
        </div>
      </ProtectedArea>
    </MenuLayout>
  );
}
