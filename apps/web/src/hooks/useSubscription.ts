import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

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

  // Buscar assinatura real do banco de dados
  useEffect(() => {
    if (!user || !usuarioData?.empresa_id) {
      setLoading(false);
      return;
    }

    const fetchAssinatura = async () => {
      try {
        setLoading(true);
        
        // Buscar assinatura da empresa - com tratamento de erro mais robusto
        const { data: assinaturaData, error: assinaturaError } = await supabase
          .from('assinaturas')
          .select(`
            *,
            planos!inner(nome, descricao, preco, limite_usuarios, limite_produtos, limite_clientes, limite_fornecedores, recursos_disponiveis)
          `)
          .eq('empresa_id', usuarioData.empresa_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Se não há erro e há dados, pegar o primeiro item
        if (!assinaturaError && assinaturaData && assinaturaData.length > 0) {
          const primeiraAssinatura = assinaturaData[0];
          // Mapear dados da assinatura
          const assinaturaMapeada: Assinatura = {
            id: primeiraAssinatura.id,
            empresa_id: primeiraAssinatura.empresa_id,
            plano_id: primeiraAssinatura.plano_id,
            status: primeiraAssinatura.status,
            data_inicio: primeiraAssinatura.data_inicio || primeiraAssinatura.created_at,
            data_fim: primeiraAssinatura.data_fim,
            data_trial_fim: primeiraAssinatura.data_trial_fim,
            proxima_cobranca: primeiraAssinatura.proxima_cobranca,
            valor: primeiraAssinatura.valor || 0,
            plano: {
              id: primeiraAssinatura.planos.id,
              nome: primeiraAssinatura.planos.nome,
              descricao: primeiraAssinatura.planos.descricao,
              preco: primeiraAssinatura.planos.preco,
              limite_usuarios: primeiraAssinatura.planos.limite_usuarios,
              limite_produtos: primeiraAssinatura.planos.limite_produtos,
              limite_clientes: primeiraAssinatura.planos.limite_clientes,
              limite_fornecedores: primeiraAssinatura.planos.limite_fornecedores,
              limite_ordens: 100, // Valor padrão
              recursos_disponiveis: primeiraAssinatura.planos.recursos_disponiveis || {}
            }
          };

          setAssinatura(assinaturaMapeada);
          
          // Buscar limites reais
          await fetchLimites(usuarioData.empresa_id);
        } else if (assinaturaError && assinaturaError.code !== 'PGRST116') {
          console.error('Erro ao buscar assinatura:', assinaturaError);
        }
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssinatura();
  }, [user, usuarioData?.empresa_id]);

  // Buscar limites reais da empresa
  const fetchLimites = async (empresaId: string) => {
    try {
      // Buscar contadores reais
      const [
        { count: usuariosCount },
        { count: produtosCount },
        { count: servicosCount },
        { count: clientesCount },
        { count: ordensCount },
        { count: fornecedoresCount }
      ] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('servicos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('ordens_servico').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId)
      ]);

      const limitesReais: Limites = {
        usuarios: { atual: usuariosCount || 0, limite: assinatura?.plano.limite_usuarios || 5 },
        produtos: { atual: produtosCount || 0, limite: assinatura?.plano.limite_produtos || 50 },
        servicos: { atual: servicosCount || 0, limite: 50 }, // Valor padrão
        clientes: { atual: clientesCount || 0, limite: assinatura?.plano.limite_clientes || 100 },
        ordens: { atual: ordensCount || 0, limite: 100 }, // Valor padrão
        fornecedores: { atual: fornecedoresCount || 0, limite: assinatura?.plano.limite_fornecedores || 10 }
      };

      setLimites(limitesReais);
    } catch (error) {
      console.error('Erro ao buscar limites:', error);
    }
  };

  // Funções de verificação reais
  const isTrialExpired = (): boolean => {
    if (!assinatura || assinatura.status !== 'trial') return false;
    if (!assinatura.data_trial_fim) return false;
    
    const agora = new Date();
    const fimTrial = new Date(assinatura.data_trial_fim);
    return fimTrial < agora;
  };

  const isSubscriptionActive = (): boolean => {
    if (!assinatura) return false;
    if (assinatura.status === 'cancelled' || assinatura.status === 'expired') return false;
    if (assinatura.data_fim && new Date(assinatura.data_fim) < new Date()) return false;
    return true;
  };

  const podeCriar = (tipo: 'usuarios' | 'produtos' | 'servicos' | 'clientes' | 'ordens' | 'fornecedores'): boolean => {
    if (!limites) return true;
    return limites[tipo].atual < limites[tipo].limite;
  };

  const diasRestantesTrial = (): number => {
    if (!assinatura || assinatura.status !== 'trial' || !assinatura.data_trial_fim) return 0;
    
    const hoje = new Date();
    const fimTrial = new Date(assinatura.data_trial_fim);
    const diffTime = fimTrial.getTime() - hoje.getTime();
    
    if (diffTime <= 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const temRecurso = (recurso: string): boolean => {
    if (!assinatura) return true;
    return assinatura.plano.recursos_disponiveis[recurso] === true;
  };

  // Funções para recarregar dados
  const carregarAssinatura = async () => {
    if (usuarioData?.empresa_id) {
      await fetchLimites(usuarioData.empresa_id);
    }
  };

  const carregarLimites = async () => {
    if (usuarioData?.empresa_id) {
      await fetchLimites(usuarioData.empresa_id);
    }
  };

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