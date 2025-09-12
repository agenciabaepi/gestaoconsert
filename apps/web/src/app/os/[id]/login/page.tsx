'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabasePublic } from '@/lib/supabasePublicClient';
import { FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginOSPage() {
  const params = useParams();
  const router = useRouter();
  const osId = params.id as string;
  
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senha.trim()) {
      setError('Digite a senha de acesso');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar se a senha está correta
      const { data: osData, error: osError } = await supabasePublic
        .from('ordens_servico')
        .select('id, senha_acesso')
        .eq('id', osId)
        .single();

      if (osError || !osData) {
        setError('Ordem de serviço não encontrada');
        return;
      }

      if (osData.senha_acesso !== senha) {
        setError('Senha incorreta');
        return;
      }

      // Redirecionar para a página de status
      window.location.href = `/os/${osId}/status`;
      
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <FiLock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesso ao Status
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite a senha de acesso para visualizar o status da sua ordem de serviço
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="senha" className="sr-only">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                id="senha"
                name="senha"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Digite a senha de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Acessar Status
                  <FiArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
