'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';
import { checkAuthIssues, refreshAuthToken, clearAllAuthData } from '@/utils/authUtils';

interface SessionMonitorOptions {
  autoRefreshOnError?: boolean;
  refreshOnNavigation?: boolean;
  checkInterval?: number;
}

export const useSessionMonitor = (options: SessionMonitorOptions = {}) => {
  // ✅ DESATIVADO TEMPORARIAMENTE: Monitor de sessão que causava redirecionamentos desnecessários
  console.log('⚠️ useSessionMonitor desativado para evitar loops de redirecionamento');
  
  // Retornar funções vazias para manter compatibilidade
  return {
    isMonitoring: false,
    lastCheck: 0,
    forceCheck: () => Promise.resolve(true),
    startMonitoring: () => {},
    stopMonitoring: () => {}
  };
  
  /*
  const {
    autoRefreshOnError = true,
    refreshOnNavigation = true,
    checkInterval = 30000 // 30 segundos
  } = options;

  const { session, user } = useAuth();
  const { addToast } = useToast();
  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ DESATIVADO: Função que causava redirecionamentos agressivos
  /*
  const handleSessionIssues = useCallback(async () => {
    // Código comentado para evitar loops de redirecionamento
    return true;
  }, [autoRefreshOnError, addToast]);
  */

  // ✅ Monitor periódico de sessão - MENOS AGRESSIVO
  useEffect(() => {
    if (!session || !user) return;

    const checkSession = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < checkInterval) return;
      
      lastCheckRef.current = now;
      
      // ✅ NOVO: Verificar se a sessão ainda é válida antes de fazer verificações
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession || currentSession.user.id !== user.id) {
          console.log('🔄 Sessão expirada, redirecionando...');
          return;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar sessão:', error);
        return; // Não fazer logout por erro de rede
      }
      
      await handleSessionIssues();
    };

    // ✅ AUMENTAR intervalo para 2 minutos ao invés de 30 segundos
    const safeCheckInterval = Math.max(checkInterval, 120000); // Mínimo 2 minutos
    
    // Verificar imediatamente
    checkSession();
    
    // Verificar periodicamente com intervalo maior
    intervalRef.current = setInterval(checkSession, safeCheckInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, user, checkInterval, handleSessionIssues]);

  // ✅ Listener robusto para erros de rede/autenticação
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const message = error?.message || event.message || '';
      
      // Detectar erros críticos que indicam problemas de sessão
      const criticalErrors = [
        '404', '408', '401', '403',
        'Failed to fetch',
        'NetworkError',
        'Invalid Refresh Token',
        'Uncaught (in promise) Error',
        'the server responded with a status of 404',
        'the server responded with a status of 408',
        'A listener indicated an asynchronous response'
      ];
      
      if (criticalErrors.some(errorType => message.includes(errorType))) {
        console.warn('🚨 ERRO CRÍTICO detectado - verificando sessão:', message);
        handleSessionIssues();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason || '';
      
      if (
        message.includes('404') ||
        message.includes('408') ||
        message.includes('Failed to fetch') ||
        message.includes('Invalid Refresh Token')
      ) {
        console.warn('🚨 PROMISE REJECTION - problema de sessão:', message);
        handleSessionIssues();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleSessionIssues]);

  // ✅ Refresh automático ao focar na janela
  useEffect(() => {
    if (!refreshOnNavigation) return;

    const handleFocus = () => {
      console.log('🔍 Janela focada - verificando sessão...');
      handleSessionIssues();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshOnNavigation, handleSessionIssues]);

  // ✅ Interceptar erros do Supabase
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      if (
        message.includes('the server responded with a status of 404') ||
        message.includes('the server responded with a status of 408') ||
        message.includes('A listener indicated an asynchronous response') ||
        message.includes('Uncaught (in promise)')
      ) {
        console.warn('🚨 Erro interceptado - verificando sessão:', message);
        handleSessionIssues();
      }
      
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [handleSessionIssues]);

  return {
    refreshSession: handleSessionIssues
  };
};
