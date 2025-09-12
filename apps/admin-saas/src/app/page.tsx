'use client';

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Clock, 
  Eye, 
  BarChart3, 
  Settings,
  LogOut,
  TrendingUp,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug das variáveis de ambiente
console.log('🔧 Debug - Variáveis de Ambiente:');
console.log('URL:', supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('Anon Key:', supabaseAnonKey ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('Service Key:', supabaseServiceKey ? 'Configurada' : 'NÃO CONFIGURADA');

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
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

console.log('✅ Clientes Supabase criados com sucesso');

interface Stats {
  totalEmpresas: number;
  totalUsuarios: number;
  receitaMensal: number;
  trialsAtivos: number;
}

interface User {
  id: string;
  email: string;
  nome: string;
  nivel: string;
  empresa_id: string | null;
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalEmpresas: 0,
    totalUsuarios: 0,
    receitaMensal: 0,
    trialsAtivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Verificar se é super admin
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error || !userData) {
        setError('Usuário não encontrado');
        return;
      }

      // Verificar se é admin sem empresa específica
      if (userData.nivel !== 'admin' || userData.empresa_id !== null) {
        setError('Acesso negado. Apenas super admins podem acessar este painel.');
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setError('Erro na autenticação');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando estatísticas do banco de dados...');

      // Total de empresas
      const { count: empresasCount, error: empresasError } = await supabaseAdmin
        .from('empresas')
        .select('*', { count: 'exact', head: true });

      if (empresasError) {
        console.error('Erro ao contar empresas:', empresasError);
      }

      // Total de usuários
      const { count: usuariosCount, error: usuariosError } = await supabaseAdmin
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      if (usuariosError) {
        console.error('Erro ao contar usuários:', usuariosError);
      }

      // Receita mensal e trials - tentar diferentes tabelas
      let receitaMensal = 0;
      let trialsAtivos = 0;

      // Tentar diferentes nomes de tabelas para assinaturas
      const possibleSubscriptionTables = ['assinaturas', 'subscriptions', 'planos_empresas'];
      
      for (const tableName of possibleSubscriptionTables) {
        try {
          console.log(`🔍 Tentando tabela: ${tableName}`);
          
          const { data: assinaturas, error: assinaturasError } = await supabase
            .from(tableName)
            .select('*')
            .limit(10);

          if (!assinaturasError && assinaturas) {
            console.log(`✅ Tabela ${tableName} encontrada com ${assinaturas.length} registros`);
            
            // Tentar diferentes nomes de colunas
            const statusColumn = assinaturas[0]?.status || assinaturas[0]?.estado || 'active';
            const valorColumn = assinaturas[0]?.valor_mensal || assinaturas[0]?.valor || assinaturas[0]?.preco || 0;
            
            receitaMensal = assinaturas.reduce((acc, ass) => {
              const status = ass.status || ass.estado || 'active';
              const valor = ass.valor_mensal || ass.valor || ass.preco || 0;
              
              if (status === 'active' || status === 'ativo') {
                return acc + (valor || 0);
              }
              return acc;
            }, 0);

            trialsAtivos = assinaturas.filter(ass => {
              const status = ass.status || ass.estado || 'active';
              return status === 'trial' || status === 'teste';
            }).length;

            console.log(`✅ Estatísticas calculadas: Receita R$ ${receitaMensal}, Trials: ${trialsAtivos}`);
            break; // Se encontrou uma tabela válida, para de procurar
          }
        } catch (error) {
          console.log(`❌ Tabela ${tableName} não encontrada ou erro:`, error);
          continue;
        }
      }

      // Se não encontrou nenhuma tabela de assinaturas, usar valores padrão
      if (receitaMensal === 0 && trialsAtivos === 0) {
        console.log('⚠️ Nenhuma tabela de assinaturas encontrada, usando valores padrão');
      }

      const newStats = {
        totalEmpresas: empresasCount || 0,
        totalUsuarios: usuariosCount || 0,
        receitaMensal,
        trialsAtivos
      };

      setStats(newStats);
      setLastUpdate(new Date());
      
      console.log('✅ Estatísticas carregadas:', newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas do banco de dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleRefresh = () => {
    loadStats();
  };

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
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro de Acesso</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Ir para Login
          </button>
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
              <h1 className="text-xl font-semibold text-gray-900">
                Consert Admin SaaS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user?.nome || 'Admin'}
              </span>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Update */}
        {lastUpdate && (
          <div className="mb-4 text-sm text-gray-500" suppressHydrationWarning={true}>
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmpresas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {stats.receitaMensal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trials Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trialsAtivos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ver Empresas</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Visualizar todas as empresas cadastradas
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <a href="/empresas" className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center">
              Acessar
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Relatórios</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Análises detalhadas e métricas
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <a href="/test-connection" className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors inline-block text-center">
              Acessar
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configurações do sistema
                </p>
              </div>
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
            <button className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              Acessar
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Nova empresa cadastrada
                  </p>
                  <p className="text-xs text-gray-500">Há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Assinatura ativada
                  </p>
                  <p className="text-xs text-gray-500">Há 4 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Trial iniciado
                  </p>
                  <p className="text-xs text-gray-500">Há 6 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Informações de Debug:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>URL Supabase: {supabaseUrl ? 'Configurada' : 'Não configurada'}</p>
            <p>Chave Supabase: {supabaseAnonKey ? 'Configurada' : 'Não configurada'}</p>
            <p>Usuário logado: {user?.email || 'N/A'}</p>
            <p>Nível: {user?.nivel || 'N/A'}</p>
            <p>Empresa ID: {user?.empresa_id || 'null (super admin)'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
