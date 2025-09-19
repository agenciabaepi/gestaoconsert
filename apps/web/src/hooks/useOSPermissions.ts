import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useCallback } from 'react';

export function useOSPermissions() {
  const { empresaData, usuarioData, loading } = useAuth();
  const { addToast } = useToast();

  const validateCompanyData = useCallback((showError = true) => {
    // Se ainda está carregando, não mostrar erro
    if (loading) {
      return false;
    }
    
    if (!empresaData?.id) {
      if (showError) {
        addToast('error', 'Erro: Dados da empresa não encontrados. Faça login novamente.');
      }
      return false;
    }
    return true;
  }, [empresaData?.id, loading, addToast]);

  const validateUserData = useCallback((showError = true) => {
    // Se ainda está carregando, não mostrar erro
    if (loading) {
      return false;
    }
    
    if (!usuarioData?.auth_user_id) {
      if (showError) {
        addToast('error', 'Erro: Dados do usuário não encontrados. Faça login novamente.');
      }
      return false;
    }
    return true;
  }, [usuarioData?.auth_user_id, loading, addToast]);

  const validateOSCreation = useCallback((showError = true) => {
    if (!validateCompanyData(showError) || !validateUserData(showError)) {
      return false;
    }
    return true;
  }, [validateCompanyData, validateUserData]);

  const getCompanyId = useCallback(() => {
    return empresaData?.id || null;
  }, [empresaData?.id]);

  const getUserInfo = useCallback(() => {
    return {
      authUserId: usuarioData?.auth_user_id,
      nome: usuarioData?.nome,
      email: usuarioData?.email,
      nivel: usuarioData?.nivel,
      permissoes: usuarioData?.permissoes
    };
  }, [usuarioData]);

  return {
    validateCompanyData,
    validateUserData,
    validateOSCreation,
    getCompanyId,
    getUserInfo,
    empresaData,
    usuarioData,
    loading
  };
}