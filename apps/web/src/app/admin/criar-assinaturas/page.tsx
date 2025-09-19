'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CriarAssinaturasPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const criarAssinaturas = async () => {
    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch('/api/empresa/criar-assinaturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setResultado(data);
      } else {
        toast.error(data.error || 'Erro ao criar as assinaturas');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao executar operação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Criar Assinaturas Trial
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Esta operação irá criar assinaturas trial (15 dias) para todas as empresas 
              que ainda não possuem uma assinatura no sistema.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Esta operação é irreversível</li>
                <li>• Apenas empresas sem assinatura serão afetadas</li>
                <li>• O período trial será de 15 dias a partir de hoje</li>
                <li>• Todas as assinaturas terão valor R$ 0,00</li>
              </ul>
            </div>
          </div>

          <button
            onClick={criarAssinaturas}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Executando...' : 'Criar Assinaturas Trial'}
          </button>

          {resultado && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado:</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">{resultado.message}</p>
              </div>

              {resultado.empresas && resultado.empresas.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Empresas que receberam assinatura trial:
                  </h4>
                  <div className="space-y-2">
                    {resultado.empresas.map((empresa: any, index: number) => (
                      <div key={empresa.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <p className="font-medium text-gray-900">{empresa.nome}</p>
                          <p className="text-sm text-gray-600">{empresa.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          Criada em: {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resultado.assinaturas && resultado.assinaturas.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Assinaturas criadas:
                  </h4>
                  <div className="space-y-2">
                    {resultado.assinaturas.map((assinatura: any, index: number) => (
                      <div key={assinatura.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <p className="font-medium text-blue-900">Assinatura #{index + 1}</p>
                          <p className="text-sm text-blue-700">Status: {assinatura.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-600">
                            Início: {new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-blue-600">
                            Fim Trial: {new Date(assinatura.data_trial_fim).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 