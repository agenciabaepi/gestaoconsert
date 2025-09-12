import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return; // Evitar múltiplas execuções
    
    setIsLoggingOut(true);
    try {
      // 1. Fazer logout do Supabase primeiro (mais confiável)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.warn('Erro no logout do Supabase:', error);
        // Continuar mesmo com erro
      }

      // 2. Aguardar um pouco para o Supabase processar
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Limpar estado local de forma mais específica
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key === 'user' || key === 'empresa_id' || key === 'session')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpar sessionStorage
      sessionStorage.clear();

      // 4. Forçar limpeza de cookies do Supabase
      const cookies = document.cookie.split(";");
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
        }
      });

      // 5. Aguardar um pouco mais para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 200));

      // 6. Redirecionar para login
      window.location.replace('/login'); // Usar replace ao invés de href

    } catch (error) {
      console.error('Erro no logout:', error);
      
      // Mesmo com erro, forçar limpeza e redirecionamento
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut
  };
};
