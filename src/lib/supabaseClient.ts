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
        }
      )
    : ({} as any);

<<<<<<< HEAD
// Configurações melhoradas para evitar problemas de refresh token
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'X-Client-Info': 'consert-web',
    },
  },
});

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
=======
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados');
  }
  return createClient(url, key);
}

export const forceLogout = async () => {
  console.log('🔴 FORCE LOGOUT: Iniciando logout...');
  
  try {
    // 1. Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🔴 localStorage e sessionStorage limpos');
    
    // 2. Fazer logout do Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('⚠️ Erro no logout Supabase:', error.message);
    } else {
      console.log('✅ Logout Supabase realizado');
    }
    
    // 3. Forçar limpeza do estado do Supabase
    await supabase.auth.setSession(null);
    console.log('🔴 Sessão forçada para null');
    
    // 4. Limpeza final
    localStorage.clear();
    sessionStorage.clear();
    
    // 5. Redirecionar para login
    console.log('🔄 Redirecionando para login...');
    window.location.href = '/login';
    
  } catch (error) {
    console.error('❌ Erro no forceLogout:', error);
    // Mesmo com erro, forçar redirecionamento
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
>>>>>>> stable-version
}

// Função utilitária para limpar dados de sessão corrompidos
export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sb-' + supabaseUrl.replace(/https?:\/\//, '').replace(/\.supabase\.co.*/, '') + '-auth-token');
    sessionStorage.removeItem('sb-' + supabaseUrl.replace(/https?:\/\//, '').replace(/\.supabase\.co.*/, '') + '-auth-token');
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
    console.error('Erro inesperado ao verificar sessão:', error);
    return false;
  }
};
