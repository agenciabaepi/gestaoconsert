'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';

function PagamentoFalhaContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState<any>(null);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const preferenceId = searchParams.get('preference_id');

    if (paymentId) {
      setErrorData({
        paymentId,
        preferenceId,
        status: 'rejected'
      });
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Falhou
          </h1>
          
          <p className="text-gray-600 mb-6">
            Houve um problema com seu pagamento. Tente novamente.
          </p>

          {errorData && (
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">
                <strong>ID do Pagamento:</strong> {errorData.paymentId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full">
                Voltar ao Dashboard
              </Button>
            </Link>
            
            <Link href="/ordens">
              <Button variant="outline" className="w-full">
                Tentar Novamente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagamentoFalha() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PagamentoFalhaContent />
    </Suspense>
  );
} 