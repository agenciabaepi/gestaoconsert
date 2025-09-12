'use client'

import './globals.css';
import '../styles/print.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { suppressLogsInProduction } from '@/utils/logger';
import { suppressNetworkErrors } from '@/utils/networkErrorSuppressor';
import { preCheckProblematicTables } from '@/utils/tableChecker';
import '@/utils/supabaseGlobalInterceptor';
import { useRealtimeNotificacoes } from '@/hooks/useRealtimeNotificacoes';
import { useAutoReload } from '@/hooks/useAutoReload';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import TrialExpiredGuard from '@/components/TrialExpiredGuard';
import LogoutScreen from '@/components/LogoutScreen';

import { Toaster } from 'react-hot-toast';
import StickyOrcamentoPopup from '@/components/StickyOrcamentoPopup';

// Metadata removida conforme exigência do Next.js para arquivos com "use client"

function AuthContent({ children }: { children: React.ReactNode }) {
  const { isLoggingOut, empresaData } = useAuth();
  const [banner, setBanner] = useState<{ texto: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function checkVencimento() {
      try {
        if (!empresaData?.id) return;
        const params = new URLSearchParams({ empresaId: empresaData.id });
        const res = await fetch(`/api/admin-saas/minha-assinatura?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        // Debug visível apenas em desenvolvimento
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
    <LogoutScreen />
  ) : (
    <>
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
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bypassTrialGuard = pathname?.startsWith('/admin-saas');
  
  // Suprimir logs e erros de rede em produção
  useEffect(() => {
    suppressLogsInProduction();
    suppressNetworkErrors(); // Reabilitado para reduzir erros no mobile
    
    // Pré-verificar tabelas problemáticas para evitar 404s
    preCheckProblematicTables().catch(() => {
      // Silenciar erros de verificação de tabelas
    });
  }, []);
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="/suppress-errors.js"></script>
        <script src="/aggressive-suppressor.js"></script>
        <script src="/notification.js" defer></script>
      </head>
      <body suppressHydrationWarning>
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