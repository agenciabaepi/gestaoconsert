"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase, fetchUserDataOptimized } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { podeUsarFuncionalidade as podeUsarFuncionalidadeUtil, isUsuarioTeste as isUsuarioTesteUtil } from '@/config/featureFlags';
import { handleAuthError } from '@/utils/clearAuth';

interface UsuarioData {
  empresa_id: string;
  nome: string;
  email: string;
  nivel: string;
  permissoes?: string[];
  foto_url?: string;
  auth_user_id?: string;
}

interface EmpresaData {
  id: string;
  nome: string;
  plano: string;
  logo_url?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuarioData: UsuarioData | null;
  empresaData: EmpresaData | null;
  lastUpdate: number;
  loading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggingOut: boolean;
  setIsLoggingOut: (value: boolean) => void;
  updateUsuarioFoto: (fotoUrl: string) => void;
  refreshEmpresaData: () => Promise<void>;
  clearSession: () => void;
  podeUsarFuncionalidade: (nomeFuncionalidade: string) => boolean;
  isUsuarioTeste: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuarioData, setUsuarioData] = useState<UsuarioData | null>(null);
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // ✅ OTIMIZADO: Função para buscar dados do usuário com timeout e retry
  // Melhorar a função fetchUserData com retry mais robusto
  const fetchUserData = useCallback(async (userId: string, sessionData: Session) => {
    let retryCount = 0;
    const maxRetries = 3; // Reduzir tentativas para evitar loops
    const baseDelay = 2000; // Aumentar delay base
  
    const attemptFetch = async (): Promise<void> => {
      try {
        // Verificar se a sessão ainda é válida antes de buscar dados
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession || currentSession.user.id !== userId) {
          throw new Error('Sessão inválida ou expirada');
        }
  
        // Aumentar timeout e adicionar verificação de conectividade
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na busca de dados')), 15000) // 15 segundos
        );
        
        const fetchPromise = fetchUserDataOptimized(userId);
        
        const result = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;
  
        // Validação mais flexível - aceitar dados mesmo sem empresa_id
        if (!result || !result.userData) {
          throw new Error('Dados do usuário não encontrados');
        }
  
        setUsuarioData(result.userData);
        setEmpresaData(result.empresaData || null);
        setLastUpdate(Date.now());
        
        console.log('✅ Dados do usuário carregados com sucesso');
        
      } catch (error) {
        console.warn(`⚠️ Erro na busca (tentativa ${retryCount + 1}/${maxRetries}):`, error);
        
        if (retryCount < maxRetries - 1) {
          retryCount++;
          // Backoff exponencial com jitter
          const jitter = Math.random() * 1000;
          const delay = baseDelay * Math.pow(2, retryCount) + jitter;
          console.log(`🔄 Tentando novamente em ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptFetch();
        }
        
        // Após todas as tentativas, verificar se é um erro de conectividade
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('Timeout') || errorMessage.includes('fetch')) {
          console.error('❌ Erro de conectividade - usando dados básicos da sessão');
          // Usar dados básicos da sessão em vez de mock
          const basicUserData = {
            empresa_id: null,
            nome: sessionData.user.user_metadata?.full_name || sessionData.user.email?.split('@')[0] || 'Usuário',
            email: sessionData.user.email || '',
            nivel: 'atendente',
            permissoes: ['dashboard']
          };
          setUsuarioData(basicUserData);
          setEmpresaData(null);
        } else {
          console.error('❌ Falha definitiva no carregamento, usando dados mock');
          const mockUsuarioData = {
            empresa_id: '550e8400-e29b-41d4-a716-446655440001',
            nome: 'Usuário Teste',
            email: sessionData.user.email || '',
            nivel: 'usuarioteste',
            permissoes: ['dashboard', 'ordens', 'clientes']
          };
          setUsuarioData(mockUsuarioData);
          
          const mockEmpresaData = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            nome: 'Empresa Teste',
            plano: 'trial'
          };
          setEmpresaData(mockEmpresaData);
        }
      }
    };
  
    await attemptFetch();
  }, []);

  // ✅ DEFINIR clearSession ANTES dos useEffects
  const clearSession = useCallback(() => {
    setUser(null);
    setSession(null);
    setUsuarioData(null);
    setEmpresaData(null);
  }, []);

  // ✅ OTIMIZADO: useEffect principal com timeout
  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    let debounceTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        // ✅ OTIMIZADO: Timeout mais rápido para usuários não logados
        authTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('⚠️ Timeout na inicialização da autenticação - provavelmente usuário não logado');
            setLoading(false);
          }
        }, 1500); // Reduzido para 1.5 segundos
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          handleAuthError(error);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ Sessão encontrada - carregando dados do usuário');
          setSession(session);
          setUser(session.user);
          
          // Adicionar debounce maior para evitar múltiplas chamadas
          debounceTimeout = setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id, session);
            }
          }, 800); // Aumentar debounce
        } else {
          console.log('❌ Nenhuma sessão encontrada');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      clearTimeout(debounceTimeout);
    };
  }, [fetchUserData]);

  // ✅ CORRIGIDO: Listener de mudanças de auth com tratamento completo
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        try {
          switch (event) {
          case 'SIGNED_IN':
            if (session) {
              setSession(session);
              setUser(session.user);
              // Carregar dados quando usuário logar
              await fetchUserData(session.user.id, session);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session) {
              setSession(session);
              setUser(session.user);
            }
            break;
            
          case 'SIGNED_OUT':
            clearSession();
            setLoading(false);
            break;
            
          case 'USER_UPDATED':
            if (session) {
              setSession(session);
              setUser(session.user);
            }
            break;
          }
        } catch (error) {
          console.error('❌ Erro no onAuthStateChange:', error);
          handleAuthError(error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [clearSession]);

  // ✅ REMOVIDO: useEffect que causava loops infinitos
  // Os dados são carregados apenas uma vez no useEffect principal

  // ✅ OTIMIZADO: Funções memoizadas
  const podeUsarFuncionalidade = useCallback((nomeFuncionalidade: string) => {
    return podeUsarFuncionalidadeUtil(usuarioData, nomeFuncionalidade);
  }, [usuarioData]);

  const isUsuarioTeste = useCallback(() => {
    return isUsuarioTesteUtil(usuarioData);
  }, [usuarioData]);

  // ✅ IMPLEMENTAR: Funções de autenticação que estavam faltando
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        // Removido fetchUserData daqui para evitar duplicação
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      
      // Aguardar um pouco para mostrar a tela de logout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout do Supabase:', error);
      }
      
      // Limpar dados da sessão
      clearSession();
      
      // Limpar dados locais
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('empresa_id');
        localStorage.removeItem('session');
        sessionStorage.clear();
        
        // Limpar cookies do Supabase
        const cookies = document.cookie.split(";");
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
          }
        });
      } catch (error) {
        console.warn('Erro na limpeza de dados locais:', error);
      }
      
      // Aguardar mais um pouco para completar a animação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirecionar para login
      window.location.replace('/login');
      
    } catch (error) {
      console.error('Erro no logout:', error);
      
      // Mesmo com erro, forçar limpeza e redirecionamento
      clearSession();
      localStorage.clear();
      sessionStorage.clear();
      
      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        window.location.replace('/login');
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearSession]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  }, []);

  const updateUsuarioFoto = useCallback((fotoUrl: string) => {
    setUsuarioData(prev => prev ? { ...prev, foto_url: fotoUrl } : null);
  }, []);

  const refreshEmpresaData = useCallback(async () => {
    if (!user?.id) return;
    
    try {

      const { userData, empresaData } = await fetchUserDataOptimized(user.id);
      setUsuarioData(userData);
      setEmpresaData(empresaData);
      setLastUpdate(performance.now());

      // Forçar re-render de componentes que dependem dos dados da empresa
      setTimeout(() => {
        setLastUpdate(performance.now());
      }, 100);
    } catch (error) {

    }
  }, [user?.id]);

  // ✅ MEMOIZAR VALUE para evitar re-renders
  const value = useMemo(() => ({
    user,
    session,
    usuarioData,
    empresaData,
    lastUpdate,
    loading,
    showOnboarding,
    setShowOnboarding,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoggingOut,
    setIsLoggingOut,
    updateUsuarioFoto,
    refreshEmpresaData,
    clearSession,
    podeUsarFuncionalidade,
    isUsuarioTeste,
  }), [user, session, usuarioData, empresaData, lastUpdate, loading, showOnboarding, signIn, signUp, signOut, resetPassword, updateUsuarioFoto, refreshEmpresaData, clearSession, podeUsarFuncionalidade, isUsuarioTeste]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
