'use client';

import { useState, useEffect } from 'react';
import { apiClient, ApiResponse, PaginatedResponse } from '@/lib/api';

// Hook para dados com loading e error states
export function useApiData<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchFn();
        
        if (response.ok && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Erro ao carregar dados');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFn();
      
      if (response.ok && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Hook específico para empresas
export function useEmpresas(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
} = {}) {
  return useApiData(
    () => apiClient.getEmpresas(params),
    [params.page, params.pageSize, params.search, params.status]
  );
}

// Hook específico para pagamentos
export function usePagamentos(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  expand?: string;
} = {}) {
  return useApiData(
    () => apiClient.getPagamentos(params),
    [params.page, params.pageSize, params.status, params.search, params.expand]
  );
}

// Hook específico para métricas
export function useMetrics() {
  return useApiData(() => apiClient.getMetrics());
}

// Hook específico para assinaturas
export function useAssinaturas(params: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  return useApiData(
    () => apiClient.getAssinaturas(params),
    [params.page, params.pageSize, params.status]
  );
}

// Hook específico para usuários
export function useUsuarios(params: {
  page?: number;
  pageSize?: number;
  empresa_id?: string;
  nivel?: string;
} = {}) {
  return useApiData(
    () => apiClient.getUsuarios(params),
    [params.page, params.pageSize, params.empresa_id, params.nivel]
  );
}

// Hook para operações de mutação (criar, atualizar, deletar)
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mutationFn(params);
      
      if (response.ok && response.data) {
        setData(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Erro na operação');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, data };
}
