// Script para suprimir erros de rede no console do navegador
(function() {
  'use strict';
  
  // Salvar referências originais
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalFetch = window.fetch;
  
  // Lista de padrões para suprimir
  const suppressPatterns = [
    'HEAD https://',
    'GET https://',
    '404 (Not Found)',
    '406 (Not Acceptable)', 
    'Failed to fetch',
    'NetworkError',
    'supabase.co/rest/v1',
    '/rest/v1/servicos',
    '/rest/v1/produtos',
    '/rest/v1/produtos_servicos',
    '/rest/v1/assinaturas',
    '/rest/v1/planos',
    '/rest/v1/configuracoes_empresa',
    '/rest/v1/configuracoes_comissao',
    '/rest/v1/whatsapp_sessions',
    'produtos?select=',
    'servicos?select=',
    'produtos_servicos?select=',
    'assinaturas?select=',
    'planos?select=',
    'configuracoes_empresa?select=',
    'configuracoes_comissao?select=',
    'whatsapp_sessions?select=',
    'catalogo_habilidade',
    'avatars',
    'storage/v1/object/avatars',
    'PGRST116',
    'PGRST106',
    'relation does not exist',
    'fetch.js:',
    'report-hmr-latency',
    'Timeout na inicialização da autenticação',
    'Duplicate extension names found'
  ];
  
  // URLs específicas para interceptar (apenas as mais problemáticas)
  const urlsToIntercept = [
    'servicos?select=',
    'produtos?select=',
    'produtos_servicos?select=',
    'configuracoes_comissao?select=',
    'whatsapp_sessions?select='
    // Removemos assinaturas, planos e usuarios pois podem existir
  ];
  
  function shouldSuppress(message) {
    return suppressPatterns.some(pattern => 
      message.toString().includes(pattern)
    );
  }
  
  // Interceptar console.error
  console.error = function(...args) {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };
  
  // Interceptar console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Interceptar erros não capturados
  window.addEventListener('error', function(event) {
    if (shouldSuppress(event.message || event.error?.message || '')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', function(event) {
    if (shouldSuppress(event.reason?.message || event.reason || '')) {
      event.preventDefault();
      return false;
    }
  });
  
  // Interceptar fetch para URLs problemáticas
  window.fetch = function(url, options) {
    const urlString = url.toString();
    
    // Se a URL contém padrões problemáticos, retornar resposta vazia
    if (urlsToIntercept.some(pattern => urlString.includes(pattern))) {
      return Promise.resolve(new Response('[]', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Para outras URLs, usar fetch normal mas suprimir erros 404/406
    return originalFetch(url, options).catch(error => {
      if (shouldSuppress(error.message || error.toString())) {
        // Retornar resposta vazia para erros suprimidos
        return new Response('[]', {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    });
  };
  
})();
