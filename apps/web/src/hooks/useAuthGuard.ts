import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export const useAuthGuard = () => {
  const { user, session, usuarioData, loading } = useAuth();
  const router = useRouter();
  
  // TEMPORARIAMENTE DESABILITADO - Retorna dados sem verificação
  return { user, session, usuarioData, loading };
};
