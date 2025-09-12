'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface StatusHistoricoItem {
  id: string;
  os_id: string;
  status_anterior?: string;
  status_novo: string;
  status_tecnico_anterior?: string;
  status_tecnico_novo?: string;
  usuario_id: string;
  usuario_nome?: string;
  motivo?: string;
  observacoes?: string;
  tempo_no_status_anterior?: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface StatusMetricas {
  totalMudancas: number;
  tempoMedioStatus: number;
  statusMaisComum: string;
  usuarioMaisAtivo: string;
}

/**
 * Hook para gerenciar histórico de status das OS
 */
export function useStatusHistorico(osId?: string) {
  const { usuarioData, user } = useAuth();
  const [historico, setHistorico] = useState<StatusHistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Registra uma mudança de status
   */
  const registrarMudancaStatus = async (
    osId: string,
    statusAnterior: string | null,
    statusNovo: string,
    statusTecnicoAnterior: string | null,
    statusTecnicoNovo: string | null,
    motivo?: string,
    observacoes?: string
  ): Promise<boolean> => {
    try {
      // ✅ CORREÇÃO: Usar ID padrão se usuário não estiver disponível
      let usuarioId = user?.id;
      
      // Se não temos usuário autenticado, buscar um usuário padrão da empresa
      if (!usuarioId) {
        console.warn('⚠️ Usuário não autenticado, buscando usuário padrão...');
        
        // Tentar buscar qualquer usuário da mesma empresa da OS
        const { data: osData } = await supabase
          .from('ordens_servico')
          .select('empresa_id, usuario_id')
          .eq('id', osId)
          .single();
        
        if (osData?.usuario_id) {
          usuarioId = osData.usuario_id;
        } else if (osData?.empresa_id) {
          // Buscar primeiro usuário da empresa
          const { data: usuarioEmpresa } = await supabase
            .from('usuarios')
            .select('id')
            .eq('empresa_id', osData.empresa_id)
            .limit(1)
            .single();
          
          usuarioId = usuarioEmpresa?.id;
        }
      }
      
      // Se ainda não temos usuário, registrar como sistema
      if (!usuarioId) {
        console.warn('⚠️ Nenhum usuário encontrado, registrando como sistema');
        // Vamos prosseguir com NULL e deixar a função SQL lidar com isso
      }

      // Registrar via função SQL
      console.log('🔍 DEBUG: Tentando registrar histórico:', {
        osId,
        statusAnterior,
        statusNovo,
        statusTecnicoAnterior,
        statusTecnicoNovo,
        usuarioId,
        motivo
      });

      // ✅ NOVA ESTRATÉGIA: Tentar inserção direta primeiro (mais confiável)
      // Buscar nome do usuário se disponível
      let usuarioNome = 'Sistema';
      if (usuarioId) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', usuarioId)
          .single();
        usuarioNome = userData?.nome || 'Sistema';
      }

      // Inserção direta na tabela (sabemos que ela existe)
      let { data, error } = await supabase
        .from('status_historico')
        .insert({
          os_id: osId,
          status_anterior: statusAnterior,
          status_novo: statusNovo,
          status_tecnico_anterior: statusTecnicoAnterior,
          status_tecnico_novo: statusTecnicoNovo,
          usuario_id: usuarioId,
          usuario_nome: usuarioNome,
          motivo: motivo,
          observacoes: observacoes,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
        })
        .select();
      
      // Se falhou, tentar inserção mínima (só campos obrigatórios)
      if (error) {
        console.warn('⚠️ Tentando inserção mínima...');
        const resultado = await supabase
          .from('status_historico')
          .insert({
            os_id: osId,
            status_novo: statusNovo,
            usuario_nome: usuarioNome || 'Sistema',
            motivo: motivo || 'Mudança de status'
          })
          .select();
        
        data = resultado.data;
        error = resultado.error;
      }

      console.log('🔍 DEBUG: Resposta da inserção direta:', { data, error });

      if (error) {
        console.error('❌ Erro ao inserir histórico (detalhado):', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Verificar se é problema de RLS
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === '42501') {
          console.error('🚫 PROBLEMA DE RLS: Execute o SQL para desabilitar RLS temporariamente');
        }
        
        return false;
      }

      console.log('✅ Histórico registrado com sucesso:', data);

      // Recarregar histórico se estamos visualizando esta OS
      if (osId) {
        await buscarHistorico(osId);
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar mudança:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    }
  };

  /**
   * Busca histórico de uma OS específica
   */
  const buscarHistorico = async (osId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('status_historico')
        .select(`
          id,
          os_id,
          status_anterior,
          status_novo,
          status_tecnico_anterior,
          status_tecnico_novo,
          usuario_id,
          usuario_nome,
          motivo,
          observacoes,
          tempo_no_status_anterior,
          created_at,
          ip_address,
          user_agent
        `)
        .eq('os_id', osId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca métricas de uma OS
   */
  const buscarMetricas = async (osId: string): Promise<StatusMetricas | null> => {
    try {
      const { data, error } = await supabase
        .from('status_historico')
        .select('status_novo, usuario_nome, created_at, tempo_no_status_anterior')
        .eq('os_id', osId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        return null;
      }

      const totalMudancas = data.length;
      
      // Calcular tempo médio (em horas)
      const tempos = data
        .map(item => item.tempo_no_status_anterior)
        .filter(Boolean)
        .map(tempo => {
          // Converter intervalo PostgreSQL para horas
          const match = tempo.match(/(\d+):(\d+):(\d+)/);
          if (match) {
            return parseInt(match[1]) + (parseInt(match[2]) / 60) + (parseInt(match[3]) / 3600);
          }
          return 0;
        });
      
      const tempoMedioStatus = tempos.length > 0 
        ? tempos.reduce((a, b) => a + b, 0) / tempos.length 
        : 0;

      // Status mais comum
      const statusCount = data.reduce((acc, item) => {
        acc[item.status_novo] = (acc[item.status_novo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusMaisComum = Object.entries(statusCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';

      // Usuário mais ativo
      const usuarioCount = data.reduce((acc, item) => {
        if (item.usuario_nome) {
          acc[item.usuario_nome] = (acc[item.usuario_nome] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const usuarioMaisAtivo = Object.entries(usuarioCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';

      return {
        totalMudancas,
        tempoMedioStatus: Math.round(tempoMedioStatus * 100) / 100,
        statusMaisComum,
        usuarioMaisAtivo
      };
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return null;
    }
  };

  /**
   * Busca histórico global (últimas mudanças)
   */
  const buscarHistoricoGlobal = async (limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('vw_ultimas_mudancas_status')
        .select('*')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico global:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar histórico');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-carregar histórico quando osId muda
   */
  useEffect(() => {
    if (osId) {
      buscarHistorico(osId);
    }
  }, [osId]);

  return {
    historico,
    loading,
    error,
    registrarMudancaStatus,
    buscarHistorico,
    buscarMetricas,
    buscarHistoricoGlobal
  };
}
