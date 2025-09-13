'use client'

import './globals.css';
import '../styles/print.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { useRealtimeNotificacoes } from '@/hooks/useRealtimeNotificacoes';
import { useAutoReload } from '@/hooks/useAutoReload';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import TrialExpiredGuard from '@/components/TrialExpiredGuard';
import LogoutScreen from '@/components/LogoutScreen';

import { Toaster } from 'react-hot-toast';
import StickyOrcamentoPopup from '@/components/StickyOrcamentoPopup';

function AuthContent({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);
  const [bypassTrialGuard, setBypassTrialGuard] = useState(false);



  useRealtimeNotificacoes();
  useAutoReload();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bypass_trial') === 'true') {
      setBypassTrialGuard(true);
    }
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setShowLogout(true);
      setTimeout(() => {
        signOut();
        setShowLogout(false);
      }, 2000);
    };

    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [signOut]);

  if (showLogout) {
    return <LogoutScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // ✅ CORREÇÃO: Não redirecionar automaticamente - deixar o middleware e ProtectedRoute cuidarem disso
  // Apenas mostrar loading se estiver carregando
  if (!user && !isAuthPage && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [bypassTrialGuard, setBypassTrialGuard] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bypass_trial') === 'true') {
      setBypassTrialGuard(true);
    }
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
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