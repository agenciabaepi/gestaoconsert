'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface PixPaymentProps {
  valor: number;
  ordemServicoId?: string;
  descricao?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export default function PixPayment({ 
  valor, 
  ordemServicoId, 
  descricao, 
  onSuccess, 
  onError 
}: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const criarPagamento = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pagamentos/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor,
          ordemServicoId,
          descricao,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      setPaymentId(data.pagamento_id);
      
      // Redirecionar para o Mercado Pago
      const initPoint = process.env.NODE_ENV === 'production' 
        ? data.init_point 
        : data.sandbox_init_point;
      
      window.location.href = initPoint;

    } catch (err) {
      console.error('Erro detalhado:', err);
      
      let errorMessage = 'Erro desconhecido';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      console.error('Mensagem de erro final:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Pagamento via PIX
        </h3>
        <p className="text-gray-600">
          Valor: R$ {valor.toFixed(2).replace('.', ',')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={criarPagamento}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processando...' : 'Gerar PIX'}
        </Button>

        {qrCode && (
          <div className="text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <img 
                src={qrCode} 
                alt="QR Code PIX" 
                className="mx-auto max-w-48"
              />
              <p className="text-sm text-gray-600 mt-2">
                Escaneie o QR Code com seu app bancário
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>Pagamento processado com segurança pelo Mercado Pago</p>
      </div>
    </div>
  );
} 