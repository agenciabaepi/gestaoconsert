'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔍 Testando conexão com Supabase...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

      // Testar conexão básica
      const { data, error } = await supabase
        .from('empresas')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Erro na conexão:', error);
        setResult({ error: error.message });
      } else {
        console.log('✅ Conexão bem-sucedida');
        setResult({ success: true, data });
      }
    } catch (error) {
      console.error('❌ Erro geral:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testando conexão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teste de Conexão com Banco de Dados
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultado do Teste</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Configuração:</h3>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <p>URL Supabase: {supabaseUrl || 'Não configurada'}</p>
                <p>Chave Supabase: {supabaseAnonKey ? 'Configurada' : 'Não configurada'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Resultado:</h3>
              <div className="mt-2">
                {result?.error ? (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 font-medium">Erro:</p>
                    <p className="text-red-600 text-sm">{result.error}</p>
                  </div>
                ) : result?.success ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-green-700 font-medium">Sucesso!</p>
                    <p className="text-green-600 text-sm">Conexão estabelecida com o banco de dados.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-700 font-medium">Aguardando...</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Dados Recebidos:</h3>
              <div className="mt-2">
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={testConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Testar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 