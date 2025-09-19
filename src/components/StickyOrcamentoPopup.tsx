'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface Notificacao {
  id: string;
  empresa_id: string;
  tipo: string;
  os_id: string | null;
  mensagem: string | null;
  created_at: string;
}

export default function StickyOrcamentoPopup() {
  const router = useRouter();
  const { empresaData } = useAuth();
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState<Notificacao | null>(null);
  const [numeroOS, setNumeroOS] = useState<string | number | null>(null);

  function isPendente(status?: string | null, statusTecnico?: string | null) {
    // Exibe somente enquanto o status técnico for exatamente "ORÇAMENTO ENVIADO"
    const st = (statusTecnico || '').toUpperCase();
    return st.includes('ORÇAMENTO ENVIADO') || st.includes('ORCAMENTO ENVIADO');
  }

  useEffect(() => {
    let cancelled = false;
    let channel: any;
    async function load() {
      try {
        if (!empresaData?.id) return;
        const { data, error } = await supabase
          .from('notificacoes')
          .select('id, empresa_id, tipo, os_id, mensagem, created_at')
          .eq('empresa_id', empresaData.id)
          .eq('tipo', 'orcamento_enviado')
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) return;
        const n = data && data[0];
        if (!n) return;
        if (cancelled) return;
        setNotif(n as Notificacao);
        let podeAbrir = true;
        if (n.os_id) {
          const { data: os, error: osError } = await supabase
            .from('ordens_servico')
            .select('numero_os, status, status_tecnico, id')
            .eq('id', n.os_id)
            .single();
          if (!cancelled) setNumeroOS(os?.numero_os || null);
          if (osError || !os) {
            // Se não conseguimos confirmar a OS, não abrir para evitar falso-positivo
            podeAbrir = false;
          } else if (!isPendente(os.status as any, (os as any).status_tecnico)) {
            podeAbrir = false;
          } else if (os) {
            // assina updates para fechar quando mudar
            channel = supabase
              .channel(`sticky_os_${os.id}`)
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ordens_servico', filter: `id=eq.${os.id}` }, (payload) => {
                const novo = (payload as any)?.new;
                if (!novo || novo.id !== os.id) return;
                if (!isPendente(novo.status, novo.status_tecnico)) {
                  setOpen(false);
                }
              })
              .subscribe();
          }
        }
        if (podeAbrir) setOpen(true);
      } catch {
        // silencioso
      }
    }
    load();
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, [empresaData?.id]);

  if (!open || !notif) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <button
          aria-label="Fechar"
          className="absolute right-3 top-3 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => setOpen(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
        </button>

        <div className="p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
            Orçamento enviado • Aguardando aprovação
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Novo orçamento do técnico</h2>
          <p className="mt-1 text-sm text-gray-600">Revise e aprove o orçamento para a OS.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {numeroOS ? (
              <div className="text-sm text-gray-800"><span className="font-medium">OS:</span> #{numeroOS}</div>
            ) : null}
            {notif.mensagem ? (
              <div className="text-sm text-gray-700"><span className="font-medium">Mensagem:</span> {notif.mensagem}</div>
            ) : null}
            <div className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleString('pt-BR')}</div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
            <button
              className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900"
              onClick={() => {
                if (notif.os_id) router.push(`/ordens/${notif.os_id}`);
                setOpen(false);
              }}
            >
              Abrir OS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


