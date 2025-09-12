// Interceptador global para queries do Supabase
import { supabase } from '@/lib/supabaseClient';

// Lista de tabelas que sabemos que não existem
const NONEXISTENT_TABLES = [
  'produtos',
  'servicos', 
  'produtos_servicos',
  'assinaturas',
  'planos'
];

// Cache de tabelas verificadas
const tableExistsCache = new Map<string, boolean>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
const cacheTimestamps = new Map<string, number>();

// Função para verificar se uma tabela existe
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  const now = Date.now();
  const cacheKey = `table_${tableName}`;
  
  // Verificar se a tabela está na lista de inexistentes conhecidas
  if (NONEXISTENT_TABLES.includes(tableName)) {
    tableExistsCache.set(cacheKey, false);
    cacheTimestamps.set(cacheKey, now);
    return false;
  }
  
  // Verificar cache
  if (tableExistsCache.has(cacheKey) && cacheTimestamps.has(cacheKey)) {
    const cacheTime = cacheTimestamps.get(cacheKey)!;
    if (now - cacheTime < CACHE_DURATION) {
      return tableExistsCache.get(cacheKey)!;
    }
  }
  
  try {
    // Tentar uma consulta simples para verificar se a tabela existe
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    const exists = !error || (error.code !== 'PGRST106' && error.code !== 'PGRST116');
    
    // Atualizar cache
    tableExistsCache.set(cacheKey, exists);
    cacheTimestamps.set(cacheKey, now);
    
    return exists;
  } catch (error) {
    // Em caso de erro, assumir que não existe
    tableExistsCache.set(cacheKey, false);
    cacheTimestamps.set(cacheKey, now);
    return false;
  }
};

// Função para interceptar queries do Supabase
export const interceptSupabaseQuery = async <T>(
  tableName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  // Se sabemos que a tabela não existe, retornar dados vazios imediatamente
  if (NONEXISTENT_TABLES.includes(tableName)) {
    return { 
      data: null, 
      error: { code: 'TABLE_NOT_EXISTS', message: `Table ${tableName} does not exist (cached)` } 
    };
  }
  
  // Verificar se a tabela existe
  const exists = await checkTableExists(tableName);
  
  if (!exists) {
    return { 
      data: null, 
      error: { code: 'TABLE_NOT_EXISTS', message: `Table ${tableName} does not exist` } 
    };
  }
  
  try {
    return await queryFn();
  } catch (error: any) {
    // Se for erro 404 ou similar, marcar tabela como inexistente
    if (error?.code === 'PGRST106' || error?.code === 'PGRST116' || error?.message?.includes('404')) {
      tableExistsCache.set(`table_${tableName}`, false);
      cacheTimestamps.set(`table_${tableName}`, Date.now());
      
      return { 
        data: null, 
        error: { code: 'TABLE_NOT_EXISTS', message: `Table ${tableName} does not exist` } 
      };
    }
    
    return { data: null, error };
  }
};

// Função para limpar cache
export const clearTableCache = (): void => {
  tableExistsCache.clear();
  cacheTimestamps.clear();
};

// Função para marcar uma tabela como inexistente
export const markTableAsNonexistent = (tableName: string): void => {
  const cacheKey = `table_${tableName}`;
  tableExistsCache.set(cacheKey, false);
  cacheTimestamps.set(cacheKey, Date.now());
  
  // Adicionar à lista de tabelas inexistentes se não estiver lá
  if (!NONEXISTENT_TABLES.includes(tableName)) {
    NONEXISTENT_TABLES.push(tableName);
  }
};
