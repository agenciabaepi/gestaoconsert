'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FiArrowLeft, FiEdit2, FiEye, FiPrinter } from 'react-icons/fi';
import React from 'react';
import { Cliente } from '@/types/cliente';
import MenuLayout from '@/components/MenuLayout';

export default function VisualizarClientePage() {
  const params = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'os' | 'equipamentos' | 'vendas' | 'lancamentos'>('dados');
  const [ordensServico, setOrdensServico] = useState<any[]>([]);

  useEffect(() => {
    const fetchCliente = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', params?.id ?? '')
        .single();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
      } else {
        setCliente(data);
      }
    };

    fetchCliente();
  }, [params?.id]);

  useEffect(() => {
    const fetchOrdensServico = async () => {
      if (!cliente?.id) return;
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          id,
          modelo,
          marca,
          cor,
          numero_serie,
          servico,
          peca,
          valor_peca,
          valor_servico,
          data_entrega,
          termo_garantia,
          status,
          tecnico_id,
          usuarios!tecnico_id ( nome ),
          numero_os
        `)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar ordens de serviço:', JSON.stringify(error, null, 2));
        } else {
        setOrdensServico(data);
      }
    };

    fetchOrdensServico();
  }, [cliente]);

  if (!cliente) return <p>Carregando...</p>;

  return (
    <MenuLayout>
      <div className="w-full max-w-screen-xl mx-auto flex-1 flex flex-col px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 focus:outline-none"
          >
            <FiArrowLeft className="text-lg" />
            <span>Voltar</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Visualizar Cliente</h1>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/clientes/${cliente.id}/editar`)}
            className="flex items-center gap-2 text-sm font-medium text-yellow-600 hover:text-yellow-800 focus:outline-none"
          >
            <FiEdit2 className="text-lg" />
            <span>Editar</span>
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          {['dados', 'os', 'equipamentos', 'vendas', 'lancamentos'].map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                abaAtiva === aba
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {aba === 'dados' && 'Dados do Cliente'}
              {aba === 'os' && 'Ordens de Serviço'}
              {aba === 'equipamentos' && 'Equipamentos'}
              {aba === 'vendas' && 'Vendas'}
              {aba === 'lancamentos' && 'Lançamentos'}
            </button>
          ))}
        </div>

        {abaAtiva === 'dados' && cliente && (
          <div className="bg-white rounded-md shadow-md border border-gray-100 px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><strong>Número do Cliente:</strong> {cliente.numero_cliente || '-'}</div>
              <div><strong>Nome:</strong> {cliente.nome}</div>
              <div><strong>Documento:</strong> {cliente.documento}</div>
              <div><strong>Telefone:</strong> {cliente.telefone}</div>
              <div><strong>Email:</strong> {cliente.email}</div>
              <div><strong>Responsável:</strong> {cliente.responsavel}</div>
              <div><strong>Tipo:</strong> {cliente.tipo}</div>
              <div><strong>Origem:</strong> {cliente.origem}</div>
              <div><strong>Aniversário:</strong> {cliente.aniversario}</div>
              <div><strong>CEP:</strong> {cliente.cep}</div>
              <div><strong>Endereço:</strong> {cliente.endereco}</div>
              <div><strong>Observações:</strong> {cliente.observacoes}</div>
            </div>
          </div>
        )}

        {abaAtiva === 'os' && (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-700 font-semibold">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Aparelho</th>
                  <th className="px-4 py-2 text-left">Serviço</th>
                  <th className="px-4 py-2 text-left">Peça</th>
                  <th className="px-4 py-2 text-left">Entrega</th>
                  <th className="px-4 py-2 text-left">Garantia</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordensServico.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-3 text-center text-gray-500">
                      Nenhuma ordem de serviço encontrada para este cliente.
                    </td>
                  </tr>
                ) : (
                  ordensServico.map((os, index) => (
                    <tr key={os.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500 font-medium">#{os.numero_os}</td>
                      <td className="px-4 py-2">{os.marca} {os.modelo} {os.cor}</td>
                      <td className="px-4 py-2">
                        {os.servico
                          ? `${os.servico} (R$ ${Number(os.valor_servico || 0).toFixed(2)})`
                          : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {os.peca
                          ? `${os.peca} (R$ ${Number(os.valor_peca || 0).toFixed(2)})`
                          : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {os.data_entrega ? new Date(os.data_entrega).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-2">{os.termo_garantia?.nome || '-'}</td>
                      <td className="px-4 py-2 font-semibold">
                        {`R$ ${(Number(os.valor_servico || 0) + Number(os.valor_peca || 0)).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {os.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <a
                            href={`/ordens/${os.id}`}
                            title="Visualizar"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEye />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'equipamentos' && (
          <div className="bg-white rounded-md shadow-md border border-gray-100 px-8 py-8">
            <p>Aqui listaremos os Equipamentos do cliente...</p>
          </div>
        )}

        {abaAtiva === 'vendas' && (
          <div className="bg-white rounded-md shadow-md border border-gray-100 px-8 py-8">
            <p>Aqui listaremos as Vendas do cliente...</p>
          </div>
        )}

        {abaAtiva === 'lancamentos' && (
          <div className="bg-white rounded-md shadow-md border border-gray-100 px-8 py-8">
            <p>Aqui listaremos os Lançamentos do cliente...</p>
          </div>
        )}
      </div>
    </MenuLayout>
  );
}