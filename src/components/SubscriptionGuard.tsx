import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/Button';
import { FiAlertTriangle, FiClock, FiUsers, FiBox, FiTruck } from 'react-icons/fi';

interface SubscriptionGuardProps {
  children: ReactNode;
  tipo?: 'usuarios' | 'produtos' | 'clientes' | 'fornecedores';
  recurso?: string;
}

export const SubscriptionGuard = ({ children, tipo, recurso }: SubscriptionGuardProps) => {
  const { assinatura, limites, isTrialExpired, isSubscriptionActive, podeCriar, diasRestantesTrial, temRecurso } = useSubscription();
  const router = useRouter();

  // Se não tem assinatura ativa
  if (!isSubscriptionActive()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assinatura Expirada</h2>
          <p className="text-gray-600 mb-6">
            Sua assinatura expirou. Renove para continuar usando o sistema.
          </p>
          <Button onClick={() => router.push('/planos')}>
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // Se trial expirou
  if (isTrialExpired()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FiClock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Expirado</h2>
          <p className="text-gray-600 mb-6">
            Seu período de teste de 15 dias expirou. Faça upgrade para continuar.
          </p>
          <Button onClick={() => router.push('/teste-expirado')}>
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // Se precisa de recurso específico
  if (recurso && !temRecurso(recurso)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FiAlertTriangle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recurso Indisponível</h2>
          <p className="text-gray-600 mb-6">
            Este recurso não está disponível no seu plano atual.
          </p>
          <Button onClick={() => router.push('/planos')}>
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // Se não pode criar mais itens do tipo especificado
  if (tipo && !podeCriar(tipo)) {
    const icones = {
      usuarios: FiUsers,
      produtos: FiBox,
      clientes: FiUsers,
      fornecedores: FiTruck
    };

    const Icone = icones[tipo];
    const limite = limites?.[tipo]?.limite || 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Icone className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Limite Atingido</h2>
          <p className="text-gray-600 mb-6">
            Você atingiu o limite de {tipo} do seu plano ({limite}). Faça upgrade para criar mais.
          </p>
          <Button onClick={() => router.push('/planos')}>
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // Se está no trial, mostrar aviso
  if (assinatura?.status === 'trial') {
    const diasRestantes = diasRestantesTrial();
    
    return (
      <>
        {diasRestantes <= 3 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
            <div className="flex">
              <FiClock className="w-5 h-5 text-orange-400 mr-2" />
              <div>
                <p className="text-orange-700">
                  <strong>Trial expira em {diasRestantes} dias!</strong> Faça upgrade para continuar usando o sistema.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => router.push('/planos')}
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  return <>{children}</>;
}; 