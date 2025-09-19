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

    // ✅ SIMPLIFICADO: Apenas verificar autenticação, sem timeouts complexos
    const checkAuth = () => {
      if (!user || !usuarioData) {
        // AuthContext já lidou com timeouts e conectividade
        router.replace('/login');
        return;
      }
    
      // Verificar nível de usuário
      if (Number(usuarioData.nivel) < requiredLevel) {
        router.replace('/acesso-negado');
        return;
      }
    
      // Verificar permissões específicas
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(permission => 
          podeUsarFuncionalidade(permission)
        );
        
        if (!hasPermission) {
          router.replace('/acesso-negado');
          return;
        }
      }
    };
    
    // Debounce simples - aumentado para evitar logout prematuro
    const timeoutId = setTimeout(checkAuth, 5000); // Aumentar para 5 segundos
    
    return () => clearTimeout(timeoutId);
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