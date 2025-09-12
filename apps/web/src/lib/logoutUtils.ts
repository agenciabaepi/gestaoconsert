// Funções centralizadas para logout
export const clearUserData = () => {
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
      }
  });
  
  };

export const forceClearAll = () => {
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
      }
  });
  
  };
