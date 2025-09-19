// Funções centralizadas para logout
export const clearUserData = () => {
  console.log('🔍 clearUserData: Limpando dados do usuário');
  
  // Limpar apenas dados específicos, não tudo
  localStorage.removeItem('user');
  localStorage.removeItem('session');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('session');
  
  // Limpar cookies relacionados ao Supabase
  const cookies = document.cookie.split(";");
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname};`;
      console.log(`🔍 Cookie removido: ${name}`);
    }
  });
  
  console.log('🔍 clearUserData: Dados limpos com sucesso');
};

export const forceClearAll = () => {
  console.log('🔍 forceClearAll: Limpeza forçada de todos os dados');
  
  // Limpeza completa apenas quando necessário
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar cookies relacionados ao Supabase
  const cookies = document.cookie.split(";");
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname};`;
      console.log(`🔍 Cookie removido: ${name}`);
    }
  });
  
  console.log('🔍 forceClearAll: Limpeza completa realizada');
};
