'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

export function useRealtimeNotificacoes(empresaId?: string | null) {
  const { addToast, showModal } = useToast();
  const router = useRouter();
  
  // Verificar se estamos no browser
  const isBrowser = typeof window !== 'undefined';
  // Mantém o último ID visto para evitar duplicidade e permitir fallback por polling
  const lastSeenIdRef = useRef<{ empresaId?: string | null; lastId?: string | null }>({ empresaId: null, lastId: null });
  const intervalsRef = useRef<Record<string, any>>({});
  const [notificacoesFixas, setNotificacoesFixas] = useState<any[]>([]);

  function shouldKeepAlerting(status?: string | null, statusTecnico?: string | null): boolean {
    const s = (status || '').toUpperCase();
    const st = (statusTecnico || '').toUpperCase();
    if (st.includes('ORÇAMENTO')) return true;
    if (s.includes('ORÇAMENTO')) return true;
    if (s.includes('AGUARDANDO') && (s.includes('APROVACAO') || s.includes('APROVAÇÃO'))) return true;
    return false;
  }

  function buildPopupNode(params: { numero?: string | number; mensagem?: string; createdAt?: string }) {
    const { numero, mensagem, createdAt } = params;
    return (
      React.createElement('div', { className: 'space-y-3' },
        React.createElement('div', { className: 'rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 text-sm' }, 'Novo orçamento enviado pelo técnico'),
        numero ? React.createElement('div', { className: 'text-sm text-gray-800' }, `OS #${numero}`) : null,
        mensagem ? React.createElement('div', { className: 'text-sm text-gray-700' }, mensagem) : null,
        createdAt ? React.createElement('div', { className: 'text-xs text-gray-500' }, new Date(createdAt).toLocaleString('pt-BR')) : null,
      )
    );
  }

  function presentPopup(nova: any) {
    const mensagem = nova?.mensagem || 'Você recebeu uma nova notificação';
    const tipo = (nova?.tipo || '').toLowerCase();
    
    if (tipo.includes('reparo_concluido')) {
      // Notificação de reparo concluído - NÃO exibe toast, apenas adiciona à lista fixa
      console.log('Recebida notificação de reparo concluído:', nova);
      // NÃO chama addToast aqui, pois será exibida como notificação fixa
    } else if (tipo.includes('laudo') || tipo.includes('orcamento')) {
      // Modal para orçamento enviado
      addToast('info', mensagem);
      showModal({
        title: 'Orçamento aguardando aprovação',
        messageNode: buildPopupNode({ numero: nova?.numero_os, mensagem, createdAt: nova?.created_at }),
        confirmLabel: nova?.os_id ? 'Abrir OS' : 'Ok',
        onConfirm: () => {
          if (nova?.os_id) router.push(`/ordens/${nova.os_id}`);
        }
      });
    } else {
      // Notificação padrão
      addToast('info', mensagem);
    }
  }

  // Busca notificações não lidas para exibir como fixas
  async function buscarNotificacoesFixas() {
    if (!empresaId || !isBrowser) return;
    
    try {
      console.log('🔍 [DEBUG] Buscando notificações fixas para empresa:', empresaId);
      
      // Busca TODAS as notificações de reparo concluído para debug
      try {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'reparo_concluido')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('❌ [DEBUG] Erro ao buscar notificações fixas:', error);
          return;
        }
        
        console.log('✅ [DEBUG] Notificações de reparo concluído encontradas:', data);
        console.log('✅ [DEBUG] Quantidade:', data?.length || 0);
        
        // Para debug, vamos mostrar todas as notificações da empresa
        const { data: todasNotificacoes } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false });
        
        console.log('🔍 [DEBUG] TODAS as notificações da empresa:', todasNotificacoes);
        
        setNotificacoesFixas(data || []);
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao buscar notificações fixas:', error);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao buscar notificações fixas:', error);
    }
  }

  // Marca notificação como cliente avisado
  async function marcarClienteAvisado(notificacaoId: string) {
    if (!isBrowser) return;
    
    try {
      console.log('Marcando notificação como cliente avisado:', notificacaoId);
      
      const response = await fetch('/api/notificacoes/marcar-avisado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacao_id: notificacaoId })
      });
      
      if (response.ok) {
        // Remove a notificação da lista local
        setNotificacoesFixas(prev => prev.filter(n => n.id !== notificacaoId));
        addToast('success', 'Cliente marcado como avisado!');
        console.log('Notificação marcada como avisada com sucesso');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API ao marcar cliente avisado:', response.status, errorData);
        addToast('error', 'Erro ao marcar cliente como avisado');
      }
    } catch (error) {
      console.error('Erro ao marcar cliente avisado:', error);
      addToast('error', 'Erro ao marcar cliente como avisado');
    }
  }

  function startReminderIfNeeded(osId?: string | null) {
    if (!osId || !isBrowser) return;
    if (intervalsRef.current[osId]) return; // já ativo
    intervalsRef.current[osId] = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('ordens_servico')
          .select('status, status_tecnico, numero_os')
          .eq('id', osId)
          .single();
        if (!data) return;
        if (shouldKeepAlerting(data.status as any, (data as any).status_tecnico)) {
          presentPopup({ tipo: 'orcamento_enviado', os_id: osId, numero_os: (data as any).numero_os, mensagem: 'Orçamento enviado. Aguardando sua aprovação.' });
        } else {
          clearInterval(intervalsRef.current[osId]);
          delete intervalsRef.current[osId];
        }
      } catch {}
    }, 10 * 60 * 1000); // 10 minutos
  }

  useEffect(() => {
    if (!empresaId || !isBrowser) return;

    // Reset do controle quando trocar a empresa
    if (lastSeenIdRef.current.empresaId !== empresaId) {
      lastSeenIdRef.current = { empresaId, lastId: null };
    }

    try { console.log('[notif] subscribe empresaId', empresaId); } catch {}
    // --- Realtime via Supabase (sem filtro no canal; filtramos no handler para evitar incompatibilidades) ---
    let channel: any;
    if (isBrowser) {
      channel = supabase
        .channel(`notificacoes_realtime_${empresaId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes' }, (payload) => {
        const nova = (payload as any)?.new;
        if (!nova) return;
        console.log('[notif][realtime] nova notificação recebida:', { nova, empresaId });
        if (nova.empresa_id !== empresaId) {
          console.log('[notif][realtime] empresa não confere:', nova.empresa_id, '!==', empresaId);
          return;
        }
        try { console.log('[notif][realtime] match', { nova }); } catch {}
        
        // Se for reparo concluído, adiciona à lista de notificações fixas (SEM toast)
        if (nova.tipo === 'reparo_concluido') {
          console.log('Adicionando notificação de reparo concluído à lista fixa:', nova);
          setNotificacoesFixas(prev => [nova, ...prev]);
          // NÃO chama presentPopup para evitar toast duplicado
        } else {
          presentPopup(nova);
          startReminderIfNeeded(nova?.os_id);
        }
        
        try { if (isBrowser) localStorage.setItem(`notif_last_seen_${empresaId}`, String(nova.id)); } catch {}
      });
      
      if (channel) {
        channel.subscribe((status: any) => { try { console.log('[notif][realtime] status', status); } catch {} });
      }
    }

    // Busca notificações fixas existentes
    buscarNotificacoesFixas();
    
    // --- Polling de segurança (fallback caso Realtime esteja desligado) ---
    let pollingTimer: any;
    async function poll() {
      if (!isBrowser) return;
      
      try {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('id, tipo, mensagem, os_id, created_at')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) { try { console.warn('[notif][poll] error', error); } catch {}; return; }
        const nova = data && data[0];
        if (!nova) return;
        const stored = (() => { try { return isBrowser ? localStorage.getItem(`notif_last_seen_${empresaId}`) : null; } catch { return null; } })();
        if (!lastSeenIdRef.current.lastId) lastSeenIdRef.current.lastId = stored || null;
        if (!lastSeenIdRef.current.lastId) lastSeenIdRef.current.lastId = nova.id as string; // inicializa para evitar loop
        // Se ainda não vimos este id (no localStorage), exibe agora
        if (stored !== String(nova.id)) {
          console.log('[notif][poll] nova notificação via polling:', nova);
          try { if (isBrowser) localStorage.setItem(`notif_last_seen_${empresaId}`, String(nova.id)); } catch {}
          presentPopup(nova);
          startReminderIfNeeded((nova as any)?.os_id);
          lastSeenIdRef.current.lastId = String(nova.id);
          return;
        }
        if (nova.id !== lastSeenIdRef.current.lastId) {
          console.log('[notif][poll] nova notificação via polling (diferente ID):', nova);
          lastSeenIdRef.current.lastId = nova.id as string;
          presentPopup(nova);
          startReminderIfNeeded((nova as any)?.os_id);
          try { if (isBrowser) localStorage.setItem(`notif_last_seen_${empresaId}`, String(nova.id)); } catch {}
        }
      } catch (e) { try { console.warn('[notif][poll] exception', e); } catch {} }
    }
    if (isBrowser) {
      pollingTimer = setInterval(poll, 6000);
      poll();
    }

    return () => {
      if (isBrowser) {
        supabase.removeChannel(channel);
        if (pollingTimer) clearInterval(pollingTimer);
        // limpar intervals
        Object.keys(intervalsRef.current).forEach((k) => {
          clearInterval(intervalsRef.current[k]);
        });
        intervalsRef.current = {};
      }
    };
  }, [empresaId]);

  // Retorna as funções e dados necessários
  return {
    notificacoesFixas,
    marcarClienteAvisado,
    buscarNotificacoesFixas
  };
}


