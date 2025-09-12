'use client';

import { useEffect } from 'react';
import { useTrialBlock } from '@/hooks/useTrialBlock';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface TrialExpiredGuardProps {
  children: React.ReactNode;
}

export default function TrialExpiredGuard({ children }: TrialExpiredGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { assinatura, isTrialExpired } = useSubscription();
  const { isBlocked } = useTrialBlock();

  // Se não há usuário autenticado, permitir acesso
  if (!user) {
    return <>{children}</>;
  }

  // Se está no trial e NÃO expirou, permitir acesso normal (não redirecionar)
  if (assinatura?.status === 'trial' && !isTrialExpired()) {
    return <>{children}</>;
  }

  // Se está bloqueado, não renderizar nada
  if (isBlocked) {
    return null;
  }
  return <>{children}</>;
} 