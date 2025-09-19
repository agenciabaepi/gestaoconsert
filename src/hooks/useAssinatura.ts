'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface Assinatura {
  id: string;
  empresa_id: string;
  plano_id: string;
  status: 'trial' | 'active' | 'suspended' | 'pending_payment' | 'cancelled';
  data_inicio: string;
  data_fim: string | null;
  data_trial_fim: string | null;
  proxima_cobranca: string | null;
  valor: number;
  planos: {
    nome: string;
    valor: number;
  };
  empresas: {
    nome: string;
    email_contato: string;
  };
}

export function useAssinatura() {
  const { user } = useAuth();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAssinatura = async () => {
      try {
        // Buscar empresa do usuário
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', user.id)
          .single();

        if (!usuario?.empresa_id) {
          setError('Empresa não encontrada');
          setLoading(false);
          return;
        }

        // Buscar assinatura da empresa
        const { data: assinaturaData, error: assinaturaError } = await supabase
          .from('assinaturas')
          .select(`
            *,
            planos!inner(nome, valor),
            empresas!inner(nome, email_contato)
          `)
          .eq('empresa_id', usuario.empresa_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (assinaturaError && assinaturaError.code !== 'PGRST116') {
          console.error('Erro ao buscar assinatura:', assinaturaError);
          setError('Erro ao buscar assinatura');
        } else {
          setAssinatura(assinaturaData);
        }

      } catch (err) {
        console.error('Erro no hook useAssinatura:', err);
        setError('Erro interno');
      } finally {
        setLoading(false);
      }
    };

    fetchAssinatura();
  }, [user]);

  const isTrialExpired = () => {
    if (!assinatura || assinatura.status !== 'trial') return false;
    
    const trialEnd = new Date(assinatura.data_trial_fim || '');
    const now = new Date();
    
    return trialEnd < now;
  };

  const isActive = () => {
    return assinatura?.status === 'active';
  };

  const isSuspended = () => {
    return assinatura?.status === 'suspended';
  };

  const isPendingPayment = () => {
    return assinatura?.status === 'pending_payment';
  };

  const getDaysUntilExpiration = () => {
    if (!assinatura?.data_fim) return 0;
    
    const endDate = new Date(assinatura.data_fim);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  return {
    assinatura,
    loading,
    error,
    isTrialExpired,
    isActive,
    isSuspended,
    isPendingPayment,
    getDaysUntilExpiration,
  };
} 