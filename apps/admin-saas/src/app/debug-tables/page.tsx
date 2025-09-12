'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TableInfo {
  name: string;
  exists: boolean;
  columns?: string[];
  sampleData?: any[];
  error?: string;
}

export default function DebugTablesPage() {
  const [mounted, setMounted] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    checkTables();
  }, []);

  const checkTables = async () => {
    const tableNames = ['empresas', 'usuarios', 'assinaturas', 'planos', 'clientes', 'produtos_servicos'];
    const results: TableInfo[] = [];

    for (const tableName of tableNames) {
      try {
        console.log(`🔍 Verificando tabela: ${tableName}`);
        
        // Tentar buscar dados da tabela
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`❌ Erro na tabela ${tableName}:`, error);
          results.push({
            name: tableName,
            exists: false,
            error: error.message
          });
        } else {
          console.log(`✅ Tabela ${tableName} existe`);
          
          // Buscar mais dados para análise
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);

          results.push({
            name: tableName,
            exists: true,
            sampleData: sampleData || []
          });
        }
      } catch (error) {
        console.error(`❌ Erro geral na tabela ${tableName}:`, error);
        results.push({
          name: tableName,
          exists: false,
          error: String(error)
        });
      }
    }

    setTables(results);
    setLoading(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando tabelas do banco...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Voltar ao Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900">
            Debug - Estrutura do Banco de Dados
          </h1>
          <p className="text-gray-600 mt-2">
            Verificação das tabelas existentes e suas estruturas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div key={table.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tabela: {table.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  table.exists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {table.exists ? 'EXISTE' : 'NÃO EXISTE'}
                </span>
              </div>

              {table.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    <strong>Erro:</strong> {table.error}
                  </p>
                </div>
              )}

              {table.exists && table.sampleData && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Dados de Exemplo:
                  </h4>
                  <div className="space-y-2">
                    {table.sampleData.map((row, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(row, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {table.exists && table.sampleData && table.sampleData.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Colunas Detectadas:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(table.sampleData[0]).map((column) => (
                      <span key={column} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Informações de Conexão:
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>URL Supabase: {supabaseUrl ? 'Configurada' : 'Não configurada'}</p>
            <p>Chave Supabase: {supabaseAnonKey ? 'Configurada' : 'Não configurada'}</p>
            <p>Total de tabelas verificadas: {tables.length}</p>
            <p>Tabelas existentes: {tables.filter(t => t.exists).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 