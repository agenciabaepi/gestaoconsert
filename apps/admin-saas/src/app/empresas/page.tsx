'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter
} from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug das variáveis de ambiente
console.log('🔧 Debug - Variáveis de Ambiente (Empresas):');
console.log('URL:', supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('Anon Key:', supabaseAnonKey ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('Service Key:', supabaseServiceKey ? 'Configurada' : 'NÃO CONFIGURADA');

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
}

// Cliente com chave anônima para autenticação
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Empresa {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  website: string;
  created_at: string;
  plano: string;
  maxusuarios: number;
}

export default function EmpresasPage() {
  const [mounted, setMounted] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlano, setFilterPlano] = useState('');

  useEffect(() => {
    setMounted(true);
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando empresas do banco de dados...');

      const { data, error } = await supabaseAdmin
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar empresas:', error);
        setError('Erro ao carregar empresas do banco de dados');
        return;
      }

      console.log('✅ Empresas carregadas:', data);
      console.log('📊 Total de empresas encontradas:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Primeira empresa:', data[0]);
      }
      
      setEmpresas(data || []);
    } catch (error) {
      console.error('❌ Erro geral:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.cnpj?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterPlano || empresa.plano === filterPlano;
    
    return matchesSearch && matchesFilter;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Voltar
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Gestão de Empresas
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/empresas/nova" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span>Nova Empresa</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{empresas.length}</p>
                <p className="text-sm text-gray-600">Total de Empresas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {empresas.filter(e => e.plano === 'pro').length}
                </p>
                <p className="text-sm text-gray-600">Plano Pro</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {empresas.filter(e => e.plano === 'basico').length}
                </p>
                <p className="text-sm text-gray-600">Plano Básico</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {empresas.filter(e => e.plano === 'premium').length}
                </p>
                <p className="text-sm text-gray-600">Plano Premium</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Plano
              </label>
              <select
                value={filterPlano}
                onChange={(e) => setFilterPlano(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os planos</option>
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Informações de Debug:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>URL Supabase: {supabaseUrl ? 'Configurada' : 'Não configurada'}</p>
            <p>Chave Supabase: {supabaseAnonKey ? 'Configurada' : 'Não configurada'}</p>
            <p>Total de empresas carregadas: {empresas.length}</p>
            <p>Status de loading: {loading ? 'Carregando...' : 'Concluído'}</p>
            <p>Erro: {error || 'Nenhum'}</p>
          </div>
        </div>

        {/* Empresas List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Empresas ({filteredEmpresas.length})
            </h2>
          </div>
          
          {filteredEmpresas.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {empresas.length === 0 ? 'Nenhuma empresa cadastrada' : 'Nenhuma empresa encontrada com os filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmpresas.map((empresa) => (
                <div key={empresa.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {empresa.nome}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{empresa.email}</span>
                            </div>
                            {empresa.telefone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{empresa.telefone}</span>
                              </div>
                            )}
                            {empresa.cnpj && (
                              <span className="text-gray-500">CNPJ: {empresa.cnpj}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                        {empresa.cidade && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{empresa.cidade}</span>
                          </div>
                        )}
                        {empresa.website && (
                          <div className="flex items-center space-x-1">
                            <Globe className="h-4 w-4" />
                            <span>{empresa.website}</span>
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          empresa.plano === 'premium' ? 'bg-purple-100 text-purple-800' :
                          empresa.plano === 'pro' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {empresa.plano?.toUpperCase() || 'N/A'}
                        </span>
                        <span className="text-gray-500">
                          Máx: {empresa.maxusuarios || 0} usuários
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Cadastrada em: {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 