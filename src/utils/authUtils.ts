import { supabase } from '@/lib/supabaseClient';

// Função para limpar todos os dados de autenticação
export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;

  // Limpa localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('auth') || key === 'user')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Limpa sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('auth'))) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });

  console.log('Auth data cleared');
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