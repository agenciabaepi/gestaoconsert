import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './useToast';
import { useSupabaseRetry } from './useRetry';
import { supabase } from '@/lib/supabase/client';

export interface OrdemTransformada {
  id: string;
  numeroOS: string;
  cliente: string;
  telefone: string;
  categoria: string;
  marca: string;
  modelo: string;
  statusOS: string;
  statusTecnico: string;
  entrada: string;
  prazoEntrega?: string;
  tecnico: string;
  tipo: string;
  valorFaturado?: number;
  valorPeca?: number;
  valorServico?: number;
  formaPagamento?: string;
  observacao?: string;
  relato?: string;
  condicoesEquipamento?: string;
  cor?: string;
  numeroSerie?: string;
  acessorios?: string;
  atendente?: string;
  senhaAcesso?: string;
}

interface UseOrdensReturn {
  ordens: OrdemTransformada[];
  loading: boolean;
  error: any;
  totalOS: number;
  fetchOrdens: (forceRefresh?: boolean) => Promise<void>;
  handleStatusChange: (ordemId: string, newStatus: string, newStatusTecnico: string) => void;
  handleRetry: () => Promise<void>;
}

export const useOrdens = (): UseOrdensReturn => {
  const { empresaData } = useAuth();
  const empresaId = empresaData?.id;
  const { addToast } = useToast();
  const { executeWithRetry, manualRetry } = useSupabaseRetry();

  const [ordens, setOrdens] = useState<OrdemTransformada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [cacheKey, setCacheKey] = useState('');

  // Funções auxiliares de formatação
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }, []);

  const formatPhoneNumber = useCallback((phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }, []);

  const formatFormaPagamento = useCallback((forma: string) => {
    if (!forma) return '';
    const formas: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'transferencia': 'Transferência',
      'boleto': 'Boleto'
    };
    return formas[forma] || forma;
  }, []);

  // Função principal de busca
  const fetchOrdens = useCallback(async (forceRefresh = false) => {
    if (!empresaId || !empresaId.trim()) {
      setLoading(false);
      return;
    }

    // Refresh automático da sessão
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.log('🔄 Refrescando sessão automaticamente...');
        await supabase.auth.refreshSession();
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar sessão:', error);
    }

    // Cache simples
    const now = Date.now();
    const currentCacheKey = `ordens_${empresaId}`;
    
    if (!forceRefresh && 
        cacheKey === currentCacheKey && 
        now - lastFetchTime < 30000 && 
        ordens.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await executeWithRetry(async () => {
        const { data, error } = await Promise.race([
          supabase
            .from('ordens_servico')
            .select(`
              id,
              numero_os,
              cliente_id,
              categoria,
              marca,
              modelo,
              status,
              status_tecnico,
              created_at,
              tecnico_id,
              tipo,
              valor_faturado,
              valor_peca,
              valor_servico,
              forma_pagamento,
              observacao,
              relato,
              condicoes_equipamento,
              cor,
              numero_serie,
              acessorios,
              atendente,
              senha_acesso,
              data_entrega,
              clientes!cliente_id(
                nome,
                telefone
              ),
              usuarios!tecnico_id(
                nome
              )
            `)
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false })
            .limit(500),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000)
          )
        ]);

        if (error) throw error;

        const ordensFormatadas: OrdemTransformada[] = (data || []).map((ordem: any) => ({
          id: ordem.id,
          numeroOS: ordem.numero_os?.toString() || '',
          cliente: ordem.clientes?.nome || 'Cliente não informado',
          telefone: formatPhoneNumber(ordem.clientes?.telefone || ''),
          categoria: ordem.categoria || '',
          marca: ordem.marca || '',
          modelo: ordem.modelo || '',
          statusOS: ordem.status || '',
          statusTecnico: ordem.status_tecnico || '',
          entrada: formatDate(ordem.created_at),
          prazoEntrega: ordem.data_entrega ? formatDate(ordem.data_entrega) : '',
          tecnico: ordem.usuarios?.nome || 'Não atribuído',
          tipo: ordem.tipo || 'Normal',
          valorFaturado: ordem.valor_faturado || 0,
          valorPeca: ordem.valor_peca || 0,
          valorServico: ordem.valor_servico || 0,
          formaPagamento: formatFormaPagamento(ordem.forma_pagamento || ''),
          observacao: ordem.observacao || '',
          relato: ordem.relato || '',
          condicoesEquipamento: ordem.condicoes_equipamento || '',
          cor: ordem.cor || '',
          numeroSerie: ordem.numero_serie || '',
          acessorios: ordem.acessorios || '',
          atendente: ordem.atendente || '',
          senhaAcesso: ordem.senha_acesso || ''
        }));

        setOrdens(ordensFormatadas);
        setLastFetchTime(now);
        setCacheKey(currentCacheKey);
      });
    } catch (err: any) {
      console.error('❌ Erro ao buscar ordens:', err);
      setError(err);
      addToast('error', 'Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  }, [empresaId, executeWithRetry, addToast, formatDate, formatPhoneNumber, formatFormaPagamento, cacheKey, lastFetchTime, ordens.length]);

  // Função para alterar status
  const handleStatusChange = useCallback((ordemId: string, newStatus: string, newStatusTecnico: string) => {
    setOrdens(prevOrdens => 
      prevOrdens.map(os => 
        os.id === ordemId 
          ? { ...os, statusOS: newStatus, statusTecnico: newStatusTecnico }
          : os
      )
    );
  }, []);

  // Função de retry
  const handleRetry = useCallback(async () => {
    setError(null);
    await manualRetry(() => fetchOrdens(true));
  }, [manualRetry, fetchOrdens]);

  // Buscar ordens na inicialização
  useEffect(() => {
    if (empresaId) {
      fetchOrdens();
    }
  }, [empresaId, fetchOrdens]);

  return {
    ordens,
    loading,
    error,
    totalOS: ordens.length,
    fetchOrdens,
    handleStatusChange,
    handleRetry
  };
};