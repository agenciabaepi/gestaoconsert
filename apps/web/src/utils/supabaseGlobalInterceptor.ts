// Interceptador global mais agressivo para Supabase
import { supabase } from '@/lib/supabaseClient';

// Lista de tabelas que sabemos que não existem (apenas as mais problemáticas)
const BLOCKED_TABLES = [
  'servicos',
  'produtos', 
  'produtos_servicos'
  // Removemos 'assinaturas' e 'planos' pois podem existir em alguns casos
];

// Função para interceptar todas as queries do Supabase
export const initializeSupabaseInterceptor = () => {
  // Interceptar o método from do Supabase
  const originalFrom = supabase.from.bind(supabase);
  
  supabase.from = function(table: string) {
    // Se a tabela está na lista de bloqueadas, retornar um mock
    if (BLOCKED_TABLES.includes(table)) {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null })
              }),
              limit: () => Promise.resolve({ data: [], error: null })
            }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            }),
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
          or: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Table blocked' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Table blocked' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Table blocked' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Table blocked' } })
      } as any;
    }
    
    // Para outras tabelas, usar o comportamento normal
    return originalFrom(table);
  };
};

// Função para inicializar no carregamento da página
if (typeof window !== 'undefined') {
  // Aguardar o Supabase estar carregado
  setTimeout(() => {
    try {
      initializeSupabaseInterceptor();
    } catch (error) {
      // Silenciar erros de inicialização
    }
  }, 100);
}
