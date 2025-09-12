import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cria o cliente do Supabase apenas no browser.
 * Evita erro "supabaseUrl is required" durante o build/prerender no servidor.
 */
export const supabase: SupabaseClient | any =
  typeof window !== 'undefined'
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true, // ✅ Persistir sessão
            autoRefreshToken: true, // ✅ Renovar tokens automaticamente
            detectSessionInUrl: true, // ✅ Detectar sessão na URL
            flowType: 'pkce' // ✅ Usar PKCE para segurança
          },
          global: {
            headers: {
              'x-client-info': 'supabase-js-web'
            }
          },
          db: {
            schema: 'public'
          },
          realtime: {
            params: {
              eventsPerSecond: 2
            }
          }
        }
      )
    : ({} as any);

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados');
  }
  return createClient(url, key);
}

export const forceLogout = async () => {
  try {
    // 1. Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Fazer logout do Supabase
    const { error } = await supabase.auth.signOut();
    
    // 3. Forçar limpeza do estado do Supabase
    await supabase.auth.setSession(null);
    
    // 4. Limpeza final
    localStorage.clear();
    sessionStorage.clear();
    
    // 5. Redirecionar para login
    window.location.href = '/login';
    
  } catch (error) {
    // Mesmo com erro, forçar redirecionamento
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
};

// Função utilitária para limpar dados de sessão corrompidos
export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
};

// Função para verificar se a sessão é válida
export const isValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erro ao verificar sessão:', error);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
};

// Função otimizada para buscar dados do usuário
export const fetchUserDataOptimized = async (userId: string) => {
  try {
    console.log('🔍 Buscando dados do usuário:', userId);
    
    // Verificar conectividade básica primeiro
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    // Tentar primeiro com auth_user_id, depois com id
    let { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        empresa_id, 
        nome, 
        email, 
        nivel, 
        permissoes, 
        foto_url
      `)
      .eq('auth_user_id', userId)
      .single();

    // Se não encontrar com auth_user_id, tentar com id
    if (error && error.code === 'PGRST116') {
      console.log('🔄 Tentando buscar usuário por ID...');
      const { data: dataById, error: errorById } = await supabase
        .from('usuarios')
        .select(`
          id,
          empresa_id, 
          nome, 
          email, 
          nivel, 
          permissoes, 
          foto_url
        `)
        .eq('id', userId)
        .single();
      
      if (errorById) {
        console.error('❌ Usuário não encontrado na base de dados:', errorById);
        throw new Error(`Usuário não encontrado: ${errorById.message}`);
      }
      
      data = dataById;
      error = null;
    }

    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      throw new Error(`Erro na consulta: ${error.message}`);
    }

    if (!data) {
      throw new Error('Dados do usuário não encontrados');
    }

    console.log('✅ Dados do usuário encontrados:', { nome: data.nome, empresa_id: data.empresa_id });

    // Se não tem empresa_id, retornar dados básicos
    if (!data.empresa_id) {
      console.log('⚠️ Usuário sem empresa associada');
      return {
        userData: {
          empresa_id: null,
          nome: data.nome,
          email: data.email,
          nivel: data.nivel || 'atendente',
          permissoes: data.permissoes || ['dashboard'],
          foto_url: data.foto_url
        },
        empresaData: null
      };
    }
    
    // Buscar dados da empresa com timeout
    console.log('🏢 Buscando dados da empresa:', data.empresa_id);
    const empresaPromise = supabase
      .from('empresas')
      .select('*')
      .eq('id', data.empresa_id)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na busca da empresa')), 5000)
    );
    
    let empresaData = null;
    try {
      const { data: empresa, error: empresaError } = await Promise.race([
        empresaPromise,
        timeoutPromise
      ]) as any;
      
      if (empresaError) {
        console.warn('⚠️ Erro ao buscar empresa, usando dados básicos:', empresaError);
      } else {
        empresaData = {
          id: empresa.id,
          nome: empresa.nome || 'Empresa',
          cnpj: empresa.cnpj || '',
          endereco: empresa.endereco || '',
          telefone: empresa.telefone || '',
          email: empresa.email || '',
          logo_url: empresa.logo_url || '',
          plano: empresa.plano || 'trial'
        };
        console.log('✅ Dados da empresa carregados:', { nome: empresaData.nome });
      }
    } catch (timeoutError) {
      console.warn('⚠️ Timeout ao buscar empresa, continuando sem dados da empresa');
    }

    const result = {
      userData: {
        empresa_id: data.empresa_id,
        nome: data.nome,
        email: data.email,
        nivel: data.nivel || 'atendente',
        permissoes: data.permissoes || ['dashboard'],
        foto_url: data.foto_url
      },
      empresaData: empresaData || {
        id: data.empresa_id,
        nome: 'Empresa',
        plano: 'trial'
      }
    };
    
    console.log('✅ Dados completos carregados com sucesso');
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados otimizados:', {
      error: error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      userId: userId
    });
    throw error;
  }
};
