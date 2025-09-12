'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestDBPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Testando conexão com o banco de dados...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

      // Testar conexão com empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .limit(5);

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError);
        setError(`Erro ao buscar empresas: ${empresasError.message}`);
        return;
      }

      console.log('✅ Empresas carregadas:', empresasData);
      setEmpresas(empresasData || []);

      // Testar conexão com usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(5);

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
        setError(`Erro ao buscar usuários: ${usuariosError.message}`);
        return;
      }

      console.log('✅ Usuários carregados:', usuariosData);
      setUsuarios(usuariosData || []);

      // Testar conexão com assinaturas
      const { data: assinaturasData, error: assinaturasError } = await supabase
        .from('assinaturas')
        .select('*')
        .limit(5);

      if (assinaturasError) {
        console.error('❌ Erro ao buscar assinaturas:', assinaturasError);
        setError(`Erro ao buscar assinaturas: ${assinaturasError.message}`);
        return;
      }

      console.log('✅ Assinaturas carregadas:', assinaturasData);
      setAssinaturas(assinaturasData || []);

      console.log('🎉 Conexão com banco de dados testada com sucesso!');

    } catch (error) {
      console.error('❌ Erro geral:', error);
      setError(`Erro geral: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testando conexão com banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teste de Conexão com Banco de Dados
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Erro:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Empresas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Empresas ({empresas.length})
            </h2>
            <div className="space-y-3">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="border-b border-gray-200 pb-3">
                  <h3 className="font-medium text-gray-900">{empresa.nome}</h3>
                  <p className="text-sm text-gray-600">{empresa.email}</p>
                  <p className="text-xs text-gray-500">CNPJ: {empresa.cnpj || 'N/A'}</p>
                </div>
              ))}
              {empresas.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma empresa encontrada</p>
              )}
            </div>
          </div>

          {/* Usuários */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Usuários ({usuarios.length})
            </h2>
            <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="border-b border-gray-200 pb-3">
                  <h3 className="font-medium text-gray-900">{usuario.nome}</h3>
                  <p className="text-sm text-gray-600">{usuario.email}</p>
                  <p className="text-xs text-gray-500">Nível: {usuario.nivel}</p>
                </div>
              ))}
              {usuarios.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum usuário encontrado</p>
              )}
            </div>
          </div>

          {/* Assinaturas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assinaturas ({assinaturas.length})
            </h2>
            <div className="space-y-3">
              {assinaturas.map((assinatura) => (
                <div key={assinatura.id} className="border-b border-gray-200 pb-3">
                  <h3 className="font-medium text-gray-900">Status: {assinatura.status}</h3>
                  <p className="text-sm text-gray-600">
                    Valor: R$ {assinatura.valor_mensal || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Plano: {assinatura.plano || 'N/A'}
                  </p>
                </div>
              ))}
              {assinaturas.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma assinatura encontrada</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={testDatabaseConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Testar Conexão Novamente
          </button>
        </div>
      </div>
    </div>
  );
} 