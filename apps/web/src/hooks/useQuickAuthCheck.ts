'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const useQuickAuthCheck = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const quickCheck = async () => {
      try {
        // Verificação super rápida de sessão - AUMENTAR TIMEOUT
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Quick auth timeout')), 5000) // Aumentar para 5s
          )
        ]) as any;

        if (error || !session) {
          console.log('🚨 Quick check: Usuário não autenticado');
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          
          // Redirecionar imediatamente para login
          setTimeout(() => {
            router.replace('/login');
          }, 100);
          
          return;
        }

        console.log('✅ Quick check: Usuário autenticado');
        setIsAuthenticated(true);
        setIsCheckingAuth(false);

      } catch (error) {
        console.warn('⚠️ Quick auth check falhou - assumindo não logado');
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        
        // Redirecionar por segurança
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
    };

    quickCheck();
  }, [router]);

  return {
    isCheckingAuth,
    isAuthenticated
  };
};
