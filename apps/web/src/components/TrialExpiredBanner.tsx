'use client';

import { useState } from 'react';
import { Button } from './Button';

interface TrialExpiredBannerProps {
  assinaturaId: string;
  empresaNome: string;
  planoNome: string;
  valor: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function TrialExpiredBanner({
  assinaturaId,
  empresaNome,
  planoNome,
  valor,
  onSuccess,
  onError
}: TrialExpiredBannerProps) {
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const gerarCobranca = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/assinaturas/gerar-cobranca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assinaturaId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar cobrança');
      }

      // Redirecionar para o Mercado Pago
      const initPoint = process.env.NODE_ENV === 'production' 
        ? data.init_point 
        : data.sandbox_init_point;
      
      window.location.href = initPoint;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao gerar cobrança:', errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showPayment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Renovar Assinatura
            </h3>
            <p className="text-gray-600">
              {empresaNome} - {planoNome}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              R$ {valor.toFixed(2).replace('.', ',')}/mês
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={gerarCobranca}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processando...' : 'Pagar via PIX'}
            </Button>
            
            <button
              onClick={() => setShowPayment(false)}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            Período de Teste Expirado
          </h3>
          <p className="text-red-700 text-sm">
            Seu período gratuito de 15 dias expirou. Para continuar usando o Consert, 
            escolha um plano e faça o pagamento.
          </p>
        </div>
        
        <Button
          onClick={() => setShowPayment(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Renovar Assinatura
        </Button>
      </div>
    </div>
  );
} 