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
      // ✅ MELHORADO: Verificação de redirecionamento recente aumentada
      const lastRedirect = sessionStorage.getItem('protectedRedirect');
      const now = Date.now();
      if (lastRedirect && (now - parseInt(lastRedirect)) < 15000) { // Aumentado para 15 segundos
        console.log('Redirecionamento de área protegida recente detectado, aguardando...');
        return;
      }
      
      // Verificar se já está na página de login
      if (window.location.pathname === '/login') {
        return;
      }
      
      // ✅ MELHORADO: Verificação de conectividade antes de redirecionar
      const isOnline = navigator.onLine;
      if (!isOnline) {
        console.log('🌐 Sem conexão com a internet, aguardando...');
        return;
      }
      
      // Se não há usuário autenticado, redirecionar para login
      if (!user || !usuarioData) {
        sessionStorage.setItem('protectedRedirect', now.toString());
        
        timeoutId = setTimeout(() => {
          if (!user || !usuarioData) { // Verificar novamente
            console.log('🔄 Redirecionando para login após timeout estendido');
            router.replace('/login');
          }
        }, 3000); // Aumentado de 1000ms para 3000ms
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
    
    // ✅ MELHORADO: Debounce aumentado para evitar verificações excessivas
    debounceTimeout = setTimeout(checkAuthAndRedirect, 1000); // Aumentado de 500ms para 1000ms
    
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