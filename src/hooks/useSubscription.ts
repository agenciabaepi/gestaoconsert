import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  limite_usuarios: number;
  limite_produtos: number;
  limite_clientes: number;
  limite_fornecedores: number;
  limite_ordens?: number;
  recursos_disponiveis: Record<string, any>;
}

interface Assinatura {
  id: string;
  empresa_id: string;
  plano_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'suspended';
  data_inicio: string;
  data_fim: string | null;
  data_trial_fim: string | null;
  proxima_cobranca: string | null;
  valor: number;
  plano: Plano;
}

interface Limites {
  usuarios: { atual: number; limite: number };
  produtos: { atual: number; limite: number };
  servicos: { atual: number; limite: number };
  clientes: { atual: number; limite: number };
  ordens: { atual: number; limite: number };
  fornecedores: { atual: number; limite: number };
}

export const useSubscription = () => {
  const { user, usuarioData } = useAuth();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [limites, setLimites] = useState<Limites | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLimites, setLoadingLimites] = useState(false);
  
  // Carregar assinatura da empresa
  const carregarAssinatura = async () => {
    // ✅ Mover a verificação para dentro da função
    if (!user || !usuarioData?.empresa_id) {
      console.log('Debug: Não há empresa_id no usuarioData');
      setLoading(false);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      console.log('Debug carregarAssinatura:', {
        usuarioData,
        empresaId: usuarioData?.empresa_id,
        userId: user?.id
      });
    }

    if (!usuarioData?.empresa_id) {
      console.log('Debug: Não há empresa_id no usuarioData');
      setLoading(false);
      return;
    }

    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('Debug: Buscando assinatura para empresa_id:', usuarioData.empresa_id);
      }
      
      // Usar API route para contornar RLS
      if (process.env.NODE_ENV === 'production') {
        console.log('Debug: Usando API route para buscar assinatura...');
      }
      
      try {
        const response = await fetch('/api/assinatura/buscar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            empresa_id: usuarioData.empresa_id
          })
        });

        const result = await response.json();
        if (process.env.NODE_ENV === 'production') {
          console.log('Debug: Resposta da API route:', result);
        }

        if (response.ok && result.data) {
          if (process.env.NODE_ENV === 'production') {
            console.log('Debug: Assinatura encontrada via API route:', result.data);
          }
          setAssinatura(result.data);
        } else {
          if (process.env.NODE_ENV === 'production') {
            console.log('Debug: Nenhuma assinatura encontrada via API route');
          }
          setAssinatura(null);
        }
      } catch (apiError) {
        console.error('Erro na API route:', apiError);
        setAssinatura(null);
      }

      // A API route já tratou tudo, não precisamos mais dessa lógica
      if (process.env.NODE_ENV === 'production') {
        console.log('Debug: Processamento da API route concluído');
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      setAssinatura(null);
    } finally {
      setLoading(false);
    }
  };

  // Carregar limites atuais
  const carregarLimites = async () => {
    if (!usuarioData?.empresa_id || !assinatura || loadingLimites) return;

    setLoadingLimites(true);
    try {
      // Fazer todas as contagens em paralelo para melhor performance
      const [
        { count: usuariosCount },
        { count: produtosCount },
        { count: servicosCount },
        { count: clientesCount },
        { count: ordensCount },
        { count: fornecedoresCount }
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id),
        supabase
          .from('produtos_servicos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id)
          .eq('tipo', 'produto'),
        supabase
          .from('produtos_servicos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id)
          .eq('tipo', 'servico'),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id),
        supabase
          .from('ordens_servico')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id),
        supabase
          .from('fornecedores')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', usuarioData.empresa_id)
      ]);

      setLimites({
        usuarios: { atual: usuariosCount || 0, limite: assinatura.plano.limite_usuarios },
        produtos: { atual: produtosCount || 0, limite: assinatura.plano.limite_produtos },
        servicos: { atual: servicosCount || 0, limite: assinatura.plano.limite_produtos }, // Usa o mesmo limite de produtos
        clientes: { atual: clientesCount || 0, limite: assinatura.plano.limite_clientes },
        ordens: { atual: ordensCount || 0, limite: assinatura.plano.limite_ordens || 15 },
        fornecedores: { atual: fornecedoresCount || 0, limite: assinatura.plano.limite_fornecedores }
      });
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    } finally {
      setLoadingLimites(false);
    }
  };

  // Verificar se trial expirou
  const isTrialExpired = (): boolean => {
    console.log('Debug isTrialExpired chamado:', {
      assinatura,
      assinaturaStatus: assinatura?.status,
      assinaturaDataTrialFim: assinatura?.data_trial_fim
    });

    if (!assinatura || assinatura.status !== 'trial') {
      console.log('Debug isTrialExpired: Não é trial ou não há assinatura');
      return false;
    }
    if (!assinatura.data_trial_fim) {
      console.log('Debug isTrialExpired: Não há data de fim do trial');
      return false;
    }
    
    const agora = new Date();
    const fimTrial = new Date(assinatura.data_trial_fim);
    const expirou = fimTrial < agora;
    
    console.log('Debug isTrialExpired:', {
      agora: agora.toISOString(),
      fimTrial: fimTrial.toISOString(),
      expirou: expirou,
      diferencaHoras: (fimTrial.getTime() - agora.getTime()) / (1000 * 60 * 60)
    });
    
    return expirou;
  };

  // Verificar se assinatura está ativa
  const isSubscriptionActive = (): boolean => {
    if (!assinatura) return false;
    if (assinatura.status === 'cancelled' || assinatura.status === 'expired') return false;
    if (assinatura.data_fim && new Date(assinatura.data_fim) < new Date()) return false;
    
    return true;
  };

  // Verificar se pode criar mais itens
  const podeCriar = (tipo: 'usuarios' | 'produtos' | 'servicos' | 'clientes' | 'ordens' | 'fornecedores'): boolean => {
    if (!limites) return false;
    return limites[tipo].atual < limites[tipo].limite;
  };

  // Obter dias restantes do trial
  const diasRestantesTrial = (): number => {
    if (!assinatura || assinatura.status !== 'trial' || !assinatura.data_trial_fim) return 0;
    
    const hoje = new Date();
    const fimTrial = new Date(assinatura.data_trial_fim);
    const diffTime = fimTrial.getTime() - hoje.getTime();
    
    // Se já expirou, retorna 0
    if (diffTime <= 0) return 0;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Verificar se tem recurso disponível
  const temRecurso = (recurso: string): boolean => {
    if (!assinatura) return false;
    return assinatura.plano.recursos_disponiveis[recurso] === true;
  };

  useEffect(() => {
    console.log('🔍 useSubscription useEffect executado:', {
      usuarioData: usuarioData ? 'PRESENTE' : 'AUSENTE',
      empresaId: usuarioData?.empresa_id,
      loading: loading,
      timestamp: new Date().toISOString()
    });
    
    // ✅ Verificação movida para dentro do useEffect
    if (!user || !usuarioData?.empresa_id || loading) {
      console.log('🔍 Não carregando assinatura:', {
        temUser: !!user,
        temUsuarioData: !!usuarioData,
        temEmpresaId: !!usuarioData?.empresa_id,
        loading: loading
      });
      return;
    }
    
    console.log('🔍 Carregando assinatura para empresa:', usuarioData.empresa_id);
    carregarAssinatura();
  }, [user, usuarioData?.empresa_id, loading]);

  useEffect(() => {
    console.log('🔍 useSubscription useEffect 2 executado:', {
      assinatura: assinatura ? 'PRESENTE' : 'AUSENTE',
      assinaturaId: assinatura?.id,
      loading: loading,
      timestamp: new Date().toISOString()
    });
    
    // Proteção contra execução desnecessária
    if (!assinatura?.id || loading) {
      console.log('🔍 Não carregando limites:', {
        temAssinatura: !!assinatura,
        temAssinaturaId: !!assinatura?.id,
        loading: loading
      });
      return;
    }
    
    console.log('🔍 Carregando limites para assinatura:', assinatura.id);
    carregarLimites();
  }, [assinatura?.id, loading]);

  // ✅ Return sempre no final, após todos os hooks
  // Se não há usuário autenticado, retornar valores padrão
  if (!user || !usuarioData) {
    return {
      assinatura: null,
      limites: null,
      loading: true,
      isTrialExpired: () => false,
      isSubscriptionActive: () => false,
      podeCriar: () => false,
      diasRestantesTrial: () => 0,
      temRecurso: () => false,
      carregarAssinatura: () => {},
      carregarLimites: () => {}
    };
  }

  return {
    assinatura,
    limites,
    loading,
    isTrialExpired,
    isSubscriptionActive,
    podeCriar,
    diasRestantesTrial,
    temRecurso,
    carregarAssinatura,
    carregarLimites
  };
};