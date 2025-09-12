'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';

function PagamentoPendenteContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    paymentId: string;
    preferenceId: string | null;
    status: string;
  } | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const preferenceId = searchParams.get('preference_id');

    if (paymentId) {
      setPaymentData({
        paymentId,
        preferenceId,
        status: 'pending'
      });
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Pendente
          </h1>
          
          <p className="text-gray-600 mb-6">
            Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
          </p>

          {paymentData && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                <strong>ID do Pagamento:</strong> {paymentData.paymentId}
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
                Ver Ordens de Serviço
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagamentoPendente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PagamentoPendenteContent />
    </Suspense>
  );
} 