'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/Toast';

interface UseOSLoadingOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelayMs?: number;
}

interface UseOSLoadingReturn {
  loading: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: Error | null) => void;
  retry: () => void;
  reset: () => void;
  executeWithLoading: <T>(operation: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook para gerenciar estados de loading com timeout e retry automático
 * Otimizado para queries do Supabase com tratamento robusto de erros
 */
export const useOSLoading = (options: UseOSLoadingOptions = {}): UseOSLoadingReturn => {
  const {
    timeoutMs = 10000, // 10 segundos padrão
    onTimeout,
    onError,
    retryAttempts = 3,
    retryDelayMs = 1000
  } = options;

  const { addToast } = useToast();
  
  // Estados principais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Refs para controle
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Cleanup timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Iniciar loading com timeout
  const startLoading = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    // Configurar timeout
    timeoutRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      
      const timeoutError = new Error(`Timeout após ${timeoutMs}ms`);
      setError(timeoutError);
      setLoading(false);
      
      if (onTimeout) {
        onTimeout();
      } else {
        addToast('warning', 'Operação demorou muito para responder. Tente novamente.');
      }
      
      console.warn('⏰ Timeout na operação:', timeoutMs + 'ms');
    }, timeoutMs);
  }, [timeoutMs, onTimeout, addToast]);

  // Parar loading
  const stopLoading = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    setLoading(false);
    clearTimeouts();
  }, [clearTimeouts]);

  // Setar erro
  const setErrorState = useCallback((newError: Error | null) => {
    if (isUnmountedRef.current) return;
    
    setError(newError);
    if (newError) {
      setLoading(false);
      clearTimeouts();
      
      if (onError) {
        onError(newError);
      }
      
      console.error('❌ Erro capturado:', newError);
    }
  }, [onError, clearTimeouts]);

  // Retry com delay progressivo
  const retry = useCallback(() => {
    if (isUnmountedRef.current || retryCount >= retryAttempts) {
      console.warn('🚫 Máximo de tentativas atingido:', retryCount, '/', retryAttempts);
      return;
    }

    setIsRetrying(true);
    const delay = retryDelayMs * Math.pow(2, retryCount); // Exponential backoff
    
    console.log(`🔄 Retry ${retryCount + 1}/${retryAttempts} em ${delay}ms`);
    
    retryTimeoutRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      setError(null);
      
      // Não reinicia loading automaticamente - deixa para executeWithLoading
    }, delay);
  }, [retryCount, retryAttempts, retryDelayMs]);

  // Reset completo
  const reset = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    setLoading(false);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    clearTimeouts();
  }, [clearTimeouts]);

  // Executar operação com loading automático
  const executeWithLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    if (isUnmountedRef.current) return null;
    
    try {
      startLoading();
      
      const result = await operation();
      
      if (!isUnmountedRef.current) {
        stopLoading();
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (!isUnmountedRef.current) {
        setErrorState(error);
      }
      
      return null;
    }
  }, [startLoading, stopLoading, setErrorState]);

  // Cleanup no unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    
    return () => {
      isUnmountedRef.current = true;
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Auto-retry quando error muda
  useEffect(() => {
    if (error && !isRetrying && retryCount < retryAttempts) {
      // Auto-retry apenas para erros específicos
      if (error.message.includes('timeout') || 
          error.message.includes('network') || 
          error.message.includes('fetch')) {
        retry();
      }
    }
  }, [error, isRetrying, retryCount, retryAttempts, retry]);

  return {
    loading,
    error,
    retryCount,
    isRetrying,
    startLoading,
    stopLoading,
    setError: setErrorState,
    retry,
    reset,
    executeWithLoading
  };
};

/**
 * Hook simplificado para queries básicas
 */
export const useOSQuery = (options?: UseOSLoadingOptions) => {
  return useOSLoading({
    timeoutMs: 8000, // Timeout mais agressivo para queries
    retryAttempts: 2, // Menos tentativas para queries
    ...options
  });
};

export default useOSLoading;