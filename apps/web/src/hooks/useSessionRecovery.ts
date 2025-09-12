import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const useSessionRecovery = () => {
  const { user, usuarioData, refreshEmpresaData } = useAuth();

  const recoverSession = useCallback(async () => {
    try {
      // Verificar se há dados em localStorage
      const localUserData = localStorage.getItem('userData');
      const localEmpresaData = localStorage.getItem('empresaData');
      
      if (localUserData && localEmpresaData && !usuarioData) {
        console.log('🔄 Recuperando dados do localStorage');
        // Tentar usar dados locais temporariamente
        const userData = JSON.parse(localUserData);
        const empresaData = JSON.parse(localEmpresaData);
        
        // Validar se os dados ainda são válidos
        const { data: { session } } = await supabase.auth.getSession();
        if (session && userData.email === session.user.email) {
          // Dados válidos, pode usar temporariamente
          return { userData, empresaData };
        }
      }
      
      // Se não há dados locais válidos, forçar refresh
      if (user && !usuarioData) {
        console.log('🔄 Forçando refresh dos dados');
        await refreshEmpresaData();
      }
    } catch (error) {
      console.error('Erro na recuperação de sessão:', error);
    }
  }, [user, usuarioData, refreshEmpresaData]);

  useEffect(() => {
    // Tentar recuperar dados após 2 segundos se ainda não carregou
    const timer = setTimeout(() => {
      if (user && !usuarioData) {
        recoverSession();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, usuarioData, recoverSession]);

  return { recoverSession };
};