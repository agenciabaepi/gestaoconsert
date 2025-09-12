/**
 * Utilitário para limpar completamente dados de autenticação corrompidos
 */

export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;

  try {
    // 1. Limpar localStorage
    localStorage.clear();
    
    // 2. Limpar sessionStorage
    sessionStorage.clear();
    
    // 3. Limpar cookies relacionados ao Supabase
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    });
    
    // 4. Limpar IndexedDB (se existir)
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('supabase');
    }
    
    console.log('✅ Dados de autenticação limpos completamente');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados de autenticação:', error);
  }
};

export const forceLogoutAndRedirect = () => {
  clearAllAuthData();
  
  // Redirecionar para login
  window.location.href = '/login';
};

export const handleAuthError = (error: any) => {
  console.error('🚨 Erro de autenticação detectado:', error);
  
  // Se for erro de refresh token, limpar tudo
  if (error?.message?.includes('Refresh Token') || 
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Refresh Token Not Found')) {
    
    console.log('🔄 Refresh Token inválido - limpando dados de autenticação');
    forceLogoutAndRedirect();
  }
};
