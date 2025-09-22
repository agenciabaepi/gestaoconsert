// Cliente para APIs do projeto principal
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.consert.app';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  reason?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cliente de API com autenticação
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: errorData.error || `HTTP ${response.status}`,
          reason: errorData.reason,
        };
      }

      const data = await response.json();
      return {
        ok: true,
        data,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Métodos para empresas
  async getEmpresas(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = `/api/admin-saas/empresas${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getEmpresa(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/admin-saas/empresas/${id}`);
  }

  async criarEmpresa(data: {
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/admin-saas/empresas/criar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos para pagamentos
  async getPagamentos(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    expand?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.expand) searchParams.set('expand', params.expand);

    const queryString = searchParams.toString();
    const endpoint = `/api/admin-saas/pagamentos${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Métodos para métricas
  async getMetrics(): Promise<ApiResponse<any>> {
    return this.request('/api/admin-saas/metrics');
  }

  // Métodos para assinaturas
  async getAssinaturas(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.status) searchParams.set('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = `/api/assinaturas${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Métodos para usuários
  async getUsuarios(params: {
    page?: number;
    pageSize?: number;
    empresa_id?: string;
    nivel?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.empresa_id) searchParams.set('empresa_id', params.empresa_id);
    if (params.nivel) searchParams.set('nivel', params.nivel);

    const queryString = searchParams.toString();
    const endpoint = `/api/usuarios${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient();

// Hooks para React Query (se necessário)
export const useApiClient = () => apiClient;


