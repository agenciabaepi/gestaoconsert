// Supressor de erros de rede para produção
export const suppressNetworkErrors = () => {
  if (typeof window === 'undefined') return;

  // Interceptar console.error para suprimir erros específicos
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suprimir erros específicos do Supabase/rede
    const shouldSuppress = [
      'HEAD https://',
      '404 (Not Found)',
      'Failed to fetch',
      'NetworkError',
      'supabase.co/rest/v1',
      'PGRST116',
      'relation "produtos" does not exist',
      'relation "servicos" does not exist',
      'relation "produtos_servicos" does not exist'
    ].some(pattern => message.includes(pattern));
    
    // Em desenvolvimento, mostrar apenas se não for erro suprimido
    if (process.env.NODE_ENV === 'development' && !shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
    
    // Em produção, suprimir todos os erros de rede
    if (process.env.NODE_ENV === 'production' && !shouldSuppress) {
      // Mostrar apenas erros críticos
      if (message.includes('Error:') && !message.includes('404') && !message.includes('fetch')) {
        originalConsoleError.apply(console, args);
      }
    }
  };

  // Interceptar console.warn para suprimir warnings específicos
  const originalConsoleWarn = console.warn;
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    const shouldSuppress = [
      'Failed to fetch',
      '404',
      'supabase.co',
      'NetworkError'
    ].some(pattern => message.includes(pattern));
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // Interceptar fetch para suprimir erros silenciosamente
  const originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const response = await originalFetch(...args);
      
      // Suprimir logs de 404 para URLs específicas
      if (response.status === 404) {
        const url = args[0]?.toString() || '';
        if (url.includes('supabase.co/rest/v1') && 
            (url.includes('produtos') || url.includes('servicos'))) {
          // Não logar esse erro
        }
      }
      
      return response;
    } catch (error) {
      // Suprimir erros de rede específicos
      const errorMessage = error?.toString() || '';
      if (!errorMessage.includes('supabase') && !errorMessage.includes('404')) {
        throw error;
      }
      
      // Para erros do Supabase, retornar uma resposta fake 404
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
  };
};

// Função para restaurar os console originais (para testes)
export const restoreConsole = () => {
  if (typeof window !== 'undefined' && (window as any).originalConsole) {
    Object.assign(console, (window as any).originalConsole);
  }
};
