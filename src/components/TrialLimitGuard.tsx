'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { FiAlertTriangle, FiLock } from 'react-icons/fi';

interface TrialLimitGuardProps {
  children: React.ReactNode;
  tipo: 'usuarios' | 'produtos' | 'servicos' | 'clientes' | 'ordens' | 'fornecedores';
  showAlert?: boolean;
}

export default function TrialLimitGuard({ children, tipo, showAlert = true }: TrialLimitGuardProps) {
  const { assinatura, limites, podeCriar, isTrialExpired, loading } = useSubscription();

  // Se ainda está carregando dados básicos, mostra loading
  if (loading) {
    return <>{children}</>;
  }

  // Se não está no trial ou já expirou, permite
  if (!assinatura || assinatura.status !== 'trial' || isTrialExpired()) {
    return <>{children}</>;
  }

  // Se não tem limites carregados ainda, permite (evita flickering)
  if (!limites) {
    return <>{children}</>;
  }

  // Se pode criar, permite
  if (podeCriar(tipo)) {
    return <>{children}</>;
  }

  // Se não pode criar, oculta o conteúdo e mostra aviso
  return (
    <div>
      {/* Aviso integrado ao design do sistema */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-gray-700 font-medium text-sm">
            Limite de {tipo} atingido
          </span>
        </div>
        <p className="text-gray-600 text-xs mb-3">
          Para criar mais {tipo}, escolha um plano adequado às suas necessidades.
        </p>
        <button 
          onClick={() => window.location.href = '/planos'}
          className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
        >
          Ver planos disponíveis
        </button>
      </div>
    </div>
  );
} 