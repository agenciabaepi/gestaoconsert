import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useCallback } from 'react';

export function useOSPermissions() {
  const { empresaData, usuarioData } = useAuth();
  const { addToast } = useToast();

  const validateCompanyData = useCallback(() => {
    if (!empresaData?.id) {
      addToast('error', 'Erro: Dados da empresa não encontrados. Faça login novamente.');
      return false;
    }
    return true;
  }, [empresaData?.id, addToast]);

  const validateUserData = useCallback(() => {
    if (!usuarioData?.id) {
      addToast('error', 'Erro: Dados do usuário não encontrados. Faça login novamente.');
      return false;
    }
    return true;
  }, [usuarioData?.id, addToast]);

  const validateOSCreation = useCallback(() => {
    if (!validateCompanyData() || !validateUserData()) {
      return false;
    }
    return true;
  }, [validateCompanyData, validateUserData]);

  const getCompanyId = useCallback(() => {
    return empresaData?.id || null;
  }, [empresaData?.id]);

  const getUserInfo = useCallback(() => {
    return {
      id: usuarioData?.id,
      nome: usuarioData?.nome,
      authUserId: usuarioData?.auth_user_id,
      tecnicoId: usuarioData?.tecnico_id
    };
  }, [usuarioData]);

  return {
    validateCompanyData,
    validateUserData,
    validateOSCreation,
    getCompanyId,
    getUserInfo,
    empresaData,
    usuarioData
  };
}