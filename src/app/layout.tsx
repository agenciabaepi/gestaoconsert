'use client'

import './globals.css';
import '../styles/print.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRealtimeNotificacoes } from '@/hooks/useRealtimeNotificacoes';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import TrialExpiredGuard from '@/components/TrialExpiredGuard';

import { Toaster } from 'react-hot-toast';
import StickyOrcamentoPopup from '@/components/StickyOrcamentoPopup';

// Metadata removida conforme exigência do Next.js para arquivos com "use client"

function AuthContent({ children }: { children: React.ReactNode }) {
  const { isLoggingOut } = useAuth();
  const { session, empresaData } = useAuth();
  // Ativar notificações realtime em toda a app quando empresa for conhecida
  useRealtimeNotificacoes(empresaData?.id);
  // Banner simples de aviso de vencimento (frontend)
  const [banner, setBanner] = useState<{ texto: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkVencimento() {
      try {
        if (!session || !empresaData?.id) return;
        const params = new URLSearchParams({ empresaId: empresaData.id });
        const res = await fetch(`/api/admin-saas/minha-assinatura?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        // Sempre loga no console para debug, mesmo em produção
        try { console.log('[minha-assinatura]', json); } catch {}
        // Debug visível em dev
        if (process.env.NODE_ENV !== 'production') {
          setDebugInfo(JSON.stringify(json));
        }
        const proxima = json?.assinatura?.proxima_cobranca ? new Date(json.assinatura.proxima_cobranca) : null;
        const status = json?.assinatura?.status || '';
        if (!proxima) return;
        const hoje = new Date();
        // Normaliza para data (ignorando horas) no fuso local
        const d0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const amanha = new Date(d0);
        amanha.setDate(d0.getDate() + 1);
        const proxDateOnly = new Date(proxima.getFullYear(), proxima.getMonth(), proxima.getDate());
        if (
          status === 'active' &&
          proxDateOnly.getTime() === amanha.getTime()
        ) {
          if (!cancelled) setBanner({ texto: `Seu acesso vence amanhã (${proxima.toLocaleDateString('pt-BR')}). Garanta a renovação para não interromper o uso.` });
        }
      } catch {}
    }
    checkVencimento();
    return () => { cancelled = true; };
  }, []);
  return isLoggingOut ? (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <span style={{ fontSize: 24 }}>Saindo...</span>
    </div>
  ) : (
    <>
<<<<<<< HEAD
=======
      {banner && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 60,
          background: '#FEF9C3', color: '#92400E',
          borderBottom: '1px solid #FDE68A',
          padding: '10px 16px', textAlign: 'center', fontSize: 14
        }}>
          {banner.texto}
        </div>
      )}
      {debugInfo && process.env.NODE_ENV !== 'production' && (
        <div style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 70, maxWidth: 420, background: 'rgba(0,0,0,0.8)', color: 'white', padding: 8, borderRadius: 8, fontSize: 11, whiteSpace: 'pre-wrap' }}>
          {debugInfo}
        </div>
      )}
>>>>>>> stable-version
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bypassTrialGuard = pathname?.startsWith('/admin-saas');
  return (
    <html lang="pt-BR">
      <head>
        <script src="/notification.js" defer></script>
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthContent>
                <StickyOrcamentoPopup />
                {bypassTrialGuard ? (
                  <>{children}</>
                ) : (
                  <TrialExpiredGuard>
                    {children}
                  </TrialExpiredGuard>
                )}
              </AuthContent>
              <Toaster position="top-right" />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}