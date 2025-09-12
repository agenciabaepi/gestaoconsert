// Verificador de tabelas existentes para evitar 404s
import { supabase } from '@/lib/supabaseClient';

// Cache de tabelas verificadas
const tableCache = new Map<string, boolean>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const cacheTimestamps = new Map<string, number>();

export const checkTableExists = async (tableName: string): Promise<boolean> => {
  const cacheKey = `table_${tableName}`;
  const now = Date.now();
  
  // Verificar cache
  if (tableCache.has(cacheKey) && cacheTimestamps.has(cacheKey)) {
    const cacheTime = cacheTimestamps.get(cacheKey)!;
    if (now - cacheTime < CACHE_DURATION) {
      return tableCache.get(cacheKey)!;
    }
  }
  
  try {
    // Tentar uma consulta simples para verificar se a tabela existe
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    const exists = !error || error.code !== 'PGRST106'; // PGRST106 = table not found
    
    // Atualizar cache
    tableCache.set(cacheKey, exists);
    cacheTimestamps.set(cacheKey, now);
    
    return exists;
  } catch (error) {
    // Em caso de erro, assumir que não existe
    tableCache.set(cacheKey, false);
    cacheTimestamps.set(cacheKey, now);
    return false;
  }
};

// Função para consulta segura que só executa se a tabela existir
export const safeQuery = async <T>(
  tableName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const exists = await checkTableExists(tableName);
  
  if (!exists) {
    return { data: null, error: { code: 'TABLE_NOT_EXISTS', message: `Table ${tableName} does not exist` } };
  }
  
  return queryFn();
};

// Lista de tabelas problemáticas conhecidas
const PROBLEMATIC_TABLES = [
  'produtos',
  'servicos', 
  'produtos_servicos',
  'assinaturas',
  'planos'
];

// Função para pré-verificar tabelas problemáticas
export const preCheckProblematicTables = async (): Promise<void> => {
  const promises = PROBLEMATIC_TABLES.map(table => checkTableExists(table));
  await Promise.allSettled(promises);
};

// Função para limpar cache
export const clearTableCache = (): void => {
  tableCache.clear();
  cacheTimestamps.clear();
};
