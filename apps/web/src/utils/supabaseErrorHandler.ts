// Utilitário para tratamento de erros do Supabase
import { PostgrestError } from '@supabase/supabase-js';

export const isNotFoundError = (error: PostgrestError | null): boolean => {
  if (!error) return false;
  
  // Erros comuns de "não encontrado"
  return (
    error.code === 'PGRST116' || // PostgREST: no rows found
    error.message?.includes('404') ||
    error.message?.includes('not found') ||
    error.message?.includes('relation') && error.message?.includes('does not exist')
  );
};

export const handleSupabaseError = (
  error: PostgrestError | null, 
  context: string = 'Supabase operation',
  silent404: boolean = true
): void => {
  if (!error) return;
  
  // Suprimir erros 404 se solicitado
  if (silent404 && isNotFoundError(error)) {
    return;
  }
  
  // Em desenvolvimento, mostrar todos os erros
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
  
  // Em produção, mostrar apenas erros críticos
  if (process.env.NODE_ENV === 'production' && !isNotFoundError(error)) {
    console.error(`Error in ${context}:`, error.message);
  }
};

// Wrapper para queries do Supabase com tratamento automático de erro
export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string = 'Query',
  fallbackValue: T | null = null
): Promise<T | null> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      handleSupabaseError(error, context);
      return fallbackValue;
    }
    
    return data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}] Unexpected error:`, err);
    }
    return fallbackValue;
  }
};
