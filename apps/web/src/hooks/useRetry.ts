'use client';

import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: any;
  hasExceededMaxAttempts: boolean;
}

export const useRetry = (config: RetryConfig = {}) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    hasExceededMaxAttempts: false
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffFactor, maxDelay]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const effectiveMaxAttempts = customConfig?.maxAttempts ?? maxAttempts;
    let currentAttempt = 0;

    const attempt = async (): Promise<T> => {
      currentAttempt++;
      
      setState(prev => ({
        ...prev,
        currentAttempt,
        isRetrying: currentAttempt > 1,
        hasExceededMaxAttempts: false
      }));

      try {
        const result = await operation();
        
        // Sucesso - resetar estado
        setState({
          isRetrying: false,
          currentAttempt: 0,
          lastError: null,
          hasExceededMaxAttempts: false
        });
        
        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          lastError: error,
          isRetrying: false
        }));

        // Se ainda há tentativas restantes
        if (currentAttempt < effectiveMaxAttempts) {
          const delay = calculateDelay(currentAttempt);
          
          onRetry?.(currentAttempt, error);
          
          console.log(`🔄 Tentativa ${currentAttempt} falhou. Tentando novamente em ${delay}ms...`, error);
          
          return new Promise((resolve, reject) => {
            timeoutRef.current = setTimeout(async () => {
              try {
                const result = await attempt();
                resolve(result);
              } catch (retryError) {
                reject(retryError);
              }
            }, delay);
          });
        } else {
          // Máximo de tentativas atingido
          setState(prev => ({
            ...prev,
            hasExceededMaxAttempts: true,
            isRetrying: false
          }));
          
          onMaxAttemptsReached?.(error);
          console.error(`❌ Máximo de tentativas (${effectiveMaxAttempts}) atingido:`, error);
          throw error;
        }
      }
    };

    return attempt();
  }, [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      hasExceededMaxAttempts: false
    });
  }, []);

  const manualRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    reset();
    return executeWithRetry(operation);
  }, [reset, executeWithRetry]);

  return {
    executeWithRetry,
    manualRetry,
    reset,
    state
  };
};

// Hook especializado para operações do Supabase
export const useSupabaseRetry = () => {
  return useRetry({
    maxAttempts: 3,
    initialDelay: 2000, // 2 segundos
    maxDelay: 10000,    // 10 segundos máximo
    backoffFactor: 2.5, // 2s, 5s, 10s
    onRetry: (attempt, error) => {
      console.log(`🔄 Tentativa ${attempt} de reconexão com Supabase...`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('❌ Não foi possível conectar com o servidor após várias tentativas');
    }
  });
};
