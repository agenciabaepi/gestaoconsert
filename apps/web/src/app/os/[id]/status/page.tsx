'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabasePublic } from '@/lib/supabasePublicClient';
import { 
  FiClock, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiTool, 
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiImage
} from 'react-icons/fi';

interface OSData {
  id: string;
  numero: string;
  cliente: string;
  telefone: string;
  email: string;
  endereco: string;
  servico: string;
  observacoes: string;
  data_entrada: string;
  status_atual: string;
  tecnico: string;
  empresa: string;
  telefone_empresa: string;
  email_empresa: string;
  logo_url: string;
  imagens: Array<{ id: string; url: string; descricao: string }>;
  status_historico: Array<{
    id: string;
    status: string;
    data: string;
    observacoes: string;
  }>;
}

export default function StatusOSPage() {
  const params = useParams();
  const osId = params.id as string;
  
  const [osData, setOsData] = useState<OSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchOSData();
  }, [osId]);

  const fetchOSData = async () => {
    try {
      setLoading(true);
      setError('');

      // Primeiro buscar dados básicos da OS
      const { data: osData, error: osError } = await supabasePublic
        .from('ordens_servico')
        .select(`
          id,
          numero,
          servico,
          observacoes,
          data_entrada,
          status_atual,
          cliente_id,
          tecnico_id,
          empresa_id,
          imagens
        `)
        .eq('id', osId)
        .single();

      if (osError) {
        console.error('Erro ao buscar OS:', osError);
        setError('Erro ao carregar dados da ordem de serviço');
        return;
      }

      if (!osData) {
        setError('Ordem de serviço não encontrada');
        return;
      }

      // Buscar dados do cliente
      const { data: clienteData } = await supabasePublic
        .from('clientes')
        .select('nome, telefone, email, endereco')
        .eq('id', osData.cliente_id)
        .single();

      // Buscar dados do técnico
      const { data: tecnicoData } = await supabasePublic
        .from('usuarios')
        .select('nome')
        .eq('id', osData.tecnico_id)
        .single();

      // Buscar dados da empresa
      const { data: empresaData } = await supabasePublic
        .from('empresas')
        .select('nome, telefone, email, logo_url')
        .eq('id', osData.empresa_id)
        .single();

      // Buscar histórico de status
      const { data: historicoData } = await supabasePublic
        .from('status_historico')
        .select('id, status, data, observacoes')
        .eq('ordem_servico_id', osId)
        .order('data', { ascending: false });

      const data = {
        ...osData,
        cliente: clienteData,
        tecnico: tecnicoData,
        empresa: empresaData,
        status_historico: historicoData || []
      };

      // Processar dados para o formato esperado
      const processedData: OSData = {
        id: data.id,
        numero: data.numero,
        cliente: data.cliente?.nome || 'Não informado',
        telefone: data.cliente?.telefone || 'Não informado',
        email: data.cliente?.email || 'Não informado',
        endereco: data.cliente?.endereco || 'Não informado',
        servico: data.servico || 'Não informado',
        observacoes: data.observacoes || 'Não informado',
        data_entrada: data.data_entrada,
        status_atual: data.status_atual || 'Não informado',
        tecnico: data.tecnico?.nome || 'Não informado',
        empresa: data.empresa?.nome || 'Não informado',
        telefone_empresa: data.empresa?.telefone || 'Não informado',
        email_empresa: data.empresa?.email || 'Não informado',
        logo_url: data.empresa?.logo_url || '',
        imagens: data.imagens || [],
        status_historico: data.status_historico || []
      };

      setOsData(processedData);
    } catch (error) {
      console.error('Erro ao buscar OS:', error);
      setError('Erro ao carregar dados da ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da ordem de serviço...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!osData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ordem de Serviço não encontrada</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ordem de Serviço #{osData.numero}
              </h1>
              <p className="text-gray-600 mt-1">
                Status atual: <span className="font-semibold text-blue-600">{osData.status_atual}</span>
              </p>
            </div>
            {osData.logo_url && (
              <img 
                src={osData.logo_url} 
                alt="Logo da empresa" 
                className="h-12 w-auto"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Cliente */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser className="h-5 w-5 mr-2 text-blue-600" />
              Informações do Cliente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FiUser className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{osData.cliente}</span>
              </div>
              <div className="flex items-center">
                <FiPhone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{osData.telefone}</span>
              </div>
              <div className="flex items-center">
                <FiMail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{osData.email}</span>
              </div>
              <div className="flex items-center">
                <FiMapPin className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{osData.endereco}</span>
              </div>
            </div>
          </div>

          {/* Informações do Serviço */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTool className="h-5 w-5 mr-2 text-blue-600" />
              Informações do Serviço
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FiFileText className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{osData.servico}</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">
                  {new Date(osData.data_entrada).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center">
                <FiUser className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">Técnico: {osData.tecnico}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        {osData.observacoes && osData.observacoes !== 'Não informado' && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
            <p className="text-gray-600">{osData.observacoes}</p>
          </div>
        )}

        {/* Histórico de Status */}
        {osData.status_historico && osData.status_historico.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiClock className="h-5 w-5 mr-2 text-blue-600" />
              Histórico de Status
            </h3>
            <div className="space-y-4">
              {osData.status_historico.map((status, index) => (
                <div key={status.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiCheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{status.status}</h4>
                      <time className="text-sm text-gray-500">
                        {new Date(status.data).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                    {status.observacoes && (
                      <p className="mt-1 text-sm text-gray-600">{status.observacoes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imagens */}
        {osData.imagens && osData.imagens.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiImage className="h-5 w-5 mr-2 text-blue-600" />
              Imagens do Aparelho
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {osData.imagens.map((imagem) => (
                <div key={imagem.id} className="relative">
                  <img
                    src={imagem.url}
                    alt={imagem.descricao || 'Imagem do aparelho'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {imagem.descricao && (
                    <p className="mt-2 text-sm text-gray-600">{imagem.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações da Empresa */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Empresa</p>
              <p className="text-gray-900">{osData.empresa}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Telefone</p>
              <p className="text-gray-900">{osData.telefone_empresa}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{osData.email_empresa}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
