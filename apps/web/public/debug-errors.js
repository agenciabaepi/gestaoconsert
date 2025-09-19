// Script de debug para capturar erros específicos das configurações
(function() {
  console.log('🔍 Debug de erros ativado - monitorando configurações');
  
  let errorCount = 0;
  let warningCount = 0;
  let fetchErrors = 0;
  let authErrors = 0;
  
  // Interceptar console.error
  const originalError = console.error;
  console.error = function(...args) {
    errorCount++;
    
    const message = args.join(' ');
    if (message.includes('auth') || message.includes('Auth') || message.includes('session') || message.includes('Session')) {
      authErrors++;
      console.log(`🔴 ERRO DE AUTH #${authErrors}:`, ...args);
    } else {
      console.log(`🔴 ERRO #${errorCount}:`, ...args);
    }
    
    originalError.apply(console, args);
  };
  
  // Interceptar console.warn
  const originalWarn = console.warn;
  console.warn = function(...args) {
    warningCount++;
    console.log(`🟡 WARNING #${warningCount}:`, ...args);
    originalWarn.apply(console, args);
  };
  
  // Interceptar fetch para capturar erros de rede
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .then(response => {
        if (!response.ok) {
          fetchErrors++;
          console.log(`🌐 FETCH ERROR #${fetchErrors}:`, {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      })
      .catch(error => {
        fetchErrors++;
        console.log(`🌐 FETCH FAILED #${fetchErrors}:`, {
          url: args[0],
          error: error.message
        });
        throw error;
      });
  };
  
  // Interceptar erros não capturados
  window.addEventListener('error', function(event) {
    console.log('🚨 UNCAUGHT ERROR:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', function(event) {
    console.log('🚨 UNHANDLED PROMISE REJECTION:', {
      reason: event.reason,
      promise: event.promise
    });
  });
  
  // Monitorar mudanças de URL para detectar redirecionamentos
  let currentUrl = window.location.href;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    console.log('📍 NAVIGATION (pushState):', {
      from: currentUrl,
      to: args[2] || window.location.href
    });
    currentUrl = args[2] || window.location.href;
    return originalPushState.apply(this, args);
  };
  
  history.replaceState = function(...args) {
    console.log('📍 NAVIGATION (replaceState):', {
      from: currentUrl,
      to: args[2] || window.location.href
    });
    currentUrl = args[2] || window.location.href;
    return originalReplaceState.apply(this, args);
  };
  
  window.addEventListener('popstate', function(event) {
    console.log('📍 NAVIGATION (popstate):', {
      from: currentUrl,
      to: window.location.href,
      state: event.state
    });
    currentUrl = window.location.href;
  });
  
  // Relatório a cada 10 segundos
  setInterval(() => {
    console.log('📊 RELATÓRIO DE ERROS:', {
      errors: errorCount,
      warnings: warningCount,
      fetchErrors: fetchErrors,
      authErrors: authErrors,
      currentUrl: window.location.href
    });
  }, 10000);
  
  console.log('✅ Debug de erros configurado com sucesso');
})();