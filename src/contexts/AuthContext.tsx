'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TwoFAConfig } from '@/lib/twoFA';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string, password: string, twoFAToken?: string) => Promise<{ success: boolean; requiresTwoFA?: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  twoFAConfig: TwoFAConfig | null;
  updateTwoFAConfig: (config: TwoFAConfig) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFAConfig, setTwoFAConfig] = useState<TwoFAConfig | null>(null);

  // Email autorizado
  const AUTHORIZED_EMAIL = 'consertilhabela@gmail.com';
  const ADMIN_PASSWORD = 'admin123'; // Em produção, use uma senha mais segura

  async function fetchServerTwoFA(email: string): Promise<TwoFAConfig | null> {
    try {
      const res = await fetch('/api/2fa/config', {
        headers: { 'x-admin-email': email },
        cache: 'no-store',
      });
      const json = await res.json();
      if (json?.ok && json?.data) return json.data as TwoFAConfig;
    } catch {}
    return null;
  }

  useEffect(() => {
    // Verificar se há uma sessão salva no localStorage
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.email === AUTHORIZED_EMAIL && authData.timestamp) {
          // Verificar se a sessão não expirou (24 horas)
          const now = new Date().getTime();
          const sessionTime = new Date(authData.timestamp).getTime();
          const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            setIsAuthenticated(true);
            setUser({ email: authData.email });
          } else {
            // Sessão expirada
            localStorage.removeItem('admin_auth');
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        localStorage.removeItem('admin_auth');
      }
    }

    // Carregar configuração 2FA do servidor
    (async () => {
      const email = AUTHORIZED_EMAIL;
      const serverCfg = await fetchServerTwoFA(email);
      setTwoFAConfig(serverCfg);
    })();

    setLoading(false);
  }, []);

  const login = async (email: string, password: string, twoFAToken?: string): Promise<{ success: boolean; requiresTwoFA?: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Verificar credenciais básicas
      if (email !== AUTHORIZED_EMAIL || password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Email ou senha incorretos.' };
      }

      // Verificar se 2FA está habilitado (servidor)
      const config = await fetchServerTwoFA(AUTHORIZED_EMAIL);
      const twoFAEnabled = config?.enabled && config?.setupComplete;

      if (twoFAEnabled) {
        // Se 2FA está habilitado mas não foi fornecido token
        if (!twoFAToken) {
          return { success: false, requiresTwoFA: true };
        }

        // Verificar token 2FA
        const { TwoFA, BackupCodes } = await import('@/lib/twoFA');
        
        let tokenValid = false;
        
        // Tentar verificar como token TOTP
        if (config.secret) {
          tokenValid = TwoFA.verifyToken(twoFAToken, config.secret);
        }
        
        // Se não é token TOTP, tentar como código de backup
        if (!tokenValid && config.backupCodes) {
          tokenValid = BackupCodes.verify(twoFAToken, config.backupCodes);
          
          // Se código de backup foi usado, removê-lo
          if (tokenValid) {
            const updatedCodes = BackupCodes.removeUsed(twoFAToken, config.backupCodes);
            const updatedConfig = { ...config, backupCodes: updatedCodes } as TwoFAConfig;
            await fetch('/api/2fa/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-admin-email': AUTHORIZED_EMAIL },
              body: JSON.stringify(updatedConfig),
            });
            setTwoFAConfig(updatedConfig);
          }
        }

        if (!tokenValid) {
          return { success: false, error: 'Código de autenticação inválido.' };
        }
      }

      // Login bem-sucedido
      const authData = {
        email,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem('admin_auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      setUser({ email });
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateTwoFAConfig = async (config: TwoFAConfig) => {
    await fetch('/api/2fa/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': AUTHORIZED_EMAIL },
      body: JSON.stringify(config),
    });
    setTwoFAConfig(config);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    twoFAConfig,
    updateTwoFAConfig,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

