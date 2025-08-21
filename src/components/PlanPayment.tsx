'use client';

import { useState } from 'react';
import PixPayment from './PixPayment';

interface PlanPaymentProps {
  planName: string;
  price: number;
  features: string[];
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export default function PlanPayment({ 
  planName, 
  price, 
  features, 
  onSuccess, 
  onError 
}: PlanPaymentProps) {
  const [showPayment, setShowPayment] = useState(false);

  if (showPayment) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pagamento - {planName}
          </h3>
          <p className="text-gray-600">
            Valor: R$ {price.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <PixPayment
          valor={price}
          descricao={`Plano ${planName} - R$ ${price.toFixed(2)}`}
          onSuccess={(paymentId) => {
            console.log('Pagamento do plano criado:', paymentId);
            onSuccess?.(paymentId);
            setShowPayment(false);
          }}
          onError={(error) => {
            console.error('Erro no pagamento do plano:', error);
            onError?.(error);
          }}
        />

        <button
          onClick={() => setShowPayment(false)}
          className="mt-4 w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {planName}
        </h3>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          R$ {price.toFixed(2).replace('.', ',')}
          <span className="text-sm font-normal text-gray-600">/mês</span>
        </div>
      </div>

      <div className="mb-6">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setShowPayment(true)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Escolher {planName}
      </button>
    </div>
  );
} 