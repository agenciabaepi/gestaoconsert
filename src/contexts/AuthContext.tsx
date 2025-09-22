'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
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

  // Email autorizado
  const AUTHORIZED_EMAIL = 'consertilhabela@gmail.com';
  const ADMIN_PASSWORD = 'admin123'; // Em produção, use uma senha mais segura

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
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar credenciais
      if (email === AUTHORIZED_EMAIL && password === ADMIN_PASSWORD) {
        const authData = {
          email,
          timestamp: new Date().toISOString(),
        };
        
        // Salvar sessão no localStorage
        localStorage.setItem('admin_auth', JSON.stringify(authData));
        
        setIsAuthenticated(true);
        setUser({ email });
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

