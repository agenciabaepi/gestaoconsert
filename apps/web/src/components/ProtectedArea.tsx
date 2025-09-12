'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedAreaProps {
  children: React.ReactNode;
  area: string;
  requiredLevel?: number;
  requiredPermissions?: string[];
}

export default function ProtectedArea({ 
  children, 
  area, 
  requiredLevel = 1, 
  requiredPermissions = [] 
}: ProtectedAreaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { user, usuarioData, loading, podeUsarFuncionalidade } = useAuth();
  const router = useRouter();

  // Padrão de hidratação segura
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificações de autenticação após montagem
  useEffect(() => {
    if (!isMounted || loading) return;

    let timeoutId: NodeJS.Timeout;
    let debounceTimeout: NodeJS.Timeout;
    
    const checkAuthAndRedirect = () => {
      // Verificar se veio de um redirecionamento recente
      const lastRedirect = sessionStorage.getItem('protectedRedirect');
      const now = Date.now();
      if (lastRedirect && (now - parseInt(lastRedirect)) < 10000) { // Aumentar para 10 segundos
        console.log('Redirecionamento de área protegida recente detectado, aguardando...');
        return;
      }
      
      // Verificar se já está na página de login
      if (window.location.pathname === '/login') {
        return;
      }
      
      // Se não há usuário autenticado, redirecionar para login
      if (!user || !usuarioData) {
        sessionStorage.setItem('protectedRedirect', now.toString());
        
        timeoutId = setTimeout(() => {
          if (!user || !usuarioData) { // Verificar novamente
            router.replace('/login');
          }
        }, 1000); // Aumentar delay
        return;
      }

      // Verificar nível de usuário
      if (Number(usuarioData.nivel) < requiredLevel) {
        timeoutId = setTimeout(() => {
          router.replace('/acesso-negado');
        }, 500);
        return;
      }

      // Verificar permissões específicas
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(permission => 
          podeUsarFuncionalidade(permission)
        );
        
        if (!hasPermission) {
          timeoutId = setTimeout(() => {
            router.replace('/acesso-negado');
          }, 500);
          return;
        }
      }
    };
    
    // Adicionar debounce para evitar múltiplas verificações
    debounceTimeout = setTimeout(checkAuthAndRedirect, 500);
    
    return () => {
      clearTimeout(debounceTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMounted, user, usuarioData, loading, router, requiredLevel, requiredPermissions, podeUsarFuncionalidade]);

  // Loading state consistente durante hidratação
  if (!isMounted || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando acesso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não há usuário ou dados, não renderizar (redirecionamento em andamento)
  if (!user || !usuarioData) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
}