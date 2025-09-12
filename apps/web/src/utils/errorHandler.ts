// Utilitário para tratamento de erros silencioso em produção
export const silentError = (error: any, context?: string) => {
  // Em desenvolvimento, mostrar o erro
  if (process.env.NODE_ENV === 'development') {
    if (context) {
      console.error(`[${context}]`, error);
    } else {
      console.error(error);
    }
  }
  // Em produção, não mostrar nada
};

// Função para suprimir erros de fetch 404
export const handleFetchError = (error: any, url?: string) => {
  // Suprimir erros 404 comuns do Supabase
  if (error?.status === 404 || error?.code === 'PGRST116') {
    // Erro 404 ou "not found" do PostgREST - suprimir
    return;
  }
  
  // Outros erros podem ser logados apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Fetch error:', error, url ? `URL: ${url}` : '');
  }
};

// Wrapper para fetch com tratamento de erro silencioso
export const silentFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    handleFetchError(error, url);
    throw error;
  }
};
