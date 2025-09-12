import { supabase } from '@/lib/supabaseClient';

// Função para limpar todos os dados de autenticação
export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;

  try {
    // Limpa localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key === 'user' || key === 'empresa_id' || key === 'session')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Limpa sessionStorage
    sessionStorage.clear();

    // Limpa cookies do Supabase
    const cookies = document.cookie.split(";");
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
      }
    });

    console.log('✅ Dados de autenticação limpos completamente');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de autenticação:', error);
  }
};

// Função para verificar se há problemas de autenticação
export const checkAuthIssues = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth error detected:', error);
      return {
        hasIssues: true,
        error: error.message,
        shouldClear: error.message.includes('Refresh Token') || error.message.includes('Invalid')
      };
    }
    
    if (!session) {
      return {
        hasIssues: false,
        error: null,
        shouldClear: false
      };
    }
    
    // Verifica se o token está próximo de expirar
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    if (expiresAt && (expiresAt - now) < 300) { // 5 minutos
      return {
        hasIssues: true,
        error: 'Token expiring soon',
        shouldClear: false
      };
    }
    
    return {
      hasIssues: false,
      error: null,
      shouldClear: false
    };
  } catch (error) {
    console.error('Error checking auth issues:', error);
    return {
      hasIssues: true,
      error: 'Unexpected error',
      shouldClear: true
    };
  }
};

// Função para forçar refresh do token
export const refreshAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Unexpected error refreshing token:', error);
    return false;
  }
};

// Função para reinicializar a sessão
export const reinitializeAuth = async () => {
  try {
    // Limpa dados corrompidos
    clearAllAuthData();
    
    // Tenta obter uma nova sessão
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error reinitializing auth:', error);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('Unexpected error reinitializing auth:', error);
    return false;
  }
}; 