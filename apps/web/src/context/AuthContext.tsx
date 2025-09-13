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
          setTimeout(() => reject(new Error('Timeout na busca de dados')), 30000) // 30 segundos
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
    
    // ✅ NOVA FUNÇÃO: Teste de conectividade específico para VPS
    const testVPSConnectivity = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Aumentar para 10s
        
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        // Não falhar por problemas de conectividade - apenas logar
        console.warn('⚠️ Verificação de conectividade falhou, continuando...');
        return true; // Assumir conectividade OK para não causar logout
      }
    };
    
    const initializeAuth = async () => {
      try {
        // ✅ SOLUÇÃO CENTRALIZADA: Timeout baseado no ambiente
        const isProduction = process.env.NODE_ENV === 'production';
        const authTimeoutDuration = isProduction ? 30000 : 10000; // 30s para VPS, 10s para localhost
        const debounceDelay = isProduction ? 2000 : 1000;
        
        authTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('⚠️ Timeout na inicialização da autenticação - provavelmente usuário não logado');
            setLoading(false);
          }
        }, authTimeoutDuration);
        
        // ✅ NOVO: Verificação de conectividade centralizada para VPS
        if (isProduction) {
          const connectivityCheck = await testVPSConnectivity();
          if (!connectivityCheck) {
            console.warn('🌐 Problemas de conectividade detectados no VPS');
            // Aumentar timeout ainda mais para VPS com problemas de rede
            clearTimeout(authTimeout);
            authTimeout = setTimeout(() => {
              if (isMounted && loading) {
                setLoading(false);
              }
            }, 45000); // 45 segundos para casos extremos
          }
        }
        
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
          
          // Adicionar debounce maior para produção
          const debounceDelay = process.env.NODE_ENV === 'production' ? 1500 : 800; // 1.5s para produção
          debounceTimeout = setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id, session);
            }
          }, debounceDelay);
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

  // ✅ OTIMIZADO: useEffect principal com timeout e retry melhorados
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;
    let initializationInProgress = false;

    const initializeAuth = async () => {
      if (initializationInProgress) {
        console.log('Inicialização já em progresso, ignorando...');
        return;
      }
      
      initializationInProgress = true;
      
      try {
        setLoading(true);
        
        // Timeout aumentado para 5 segundos
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout na inicialização da autenticação'));
          }, 5000);
        });

        const authPromise = (async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Erro ao obter sessão:', error);
              throw error;
            }
            
            if (session?.user && mounted) {
              setSession(session);
              setUser(session.user);
              
              // Implementar retry com backoff exponencial otimizado
              let retryCount = 0;
              const maxRetries = 3;
              
              while (retryCount < maxRetries && mounted) {
                try {
                  await fetchUserData(session.user.id, session);
                  console.log('✅ Dados do usuário carregados com sucesso');
                  break;
                } catch (error) {
                  retryCount++;
                  console.warn(`⚠️ Tentativa ${retryCount}/${maxRetries} falhou:`, error);
                  
                  if (retryCount < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
                    console.log(`🔄 Tentando novamente em ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  } else {
                    console.error('❌ Falha após todas as tentativas de retry:', error);
                    // Não limpar sessão em caso de erro de rede, apenas os dados do usuário
                    if (mounted) {
                      setUsuarioData(null);
                      setEmpresaData(null);
                    }
                  }
                }
              }
            } else if (mounted) {
              // Não há sessão válida
              clearSession();
            }
          } catch (error) {
            console.error('Erro no authPromise:', error);
            throw error;
          }
        })();

        await Promise.race([authPromise, timeoutPromise]);
        
      } catch (error) {
        if (mounted) {
          console.error('❌ Erro na inicialização da autenticação:', error);
          
          // Só limpar sessão se for erro de autenticação, não de rede
          if (error?.message?.includes('Invalid') || error?.message?.includes('Unauthorized')) {
            clearSession();
          } else {
            // Para erros de rede/timeout, manter sessão mas marcar como não carregando
            console.log('🔄 Erro de rede detectado, mantendo sessão existente');
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          initializationInProgress = false;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    // Debounce reduzido para inicialização mais rápida
    const debounceTimeout = setTimeout(initializeAuth, 50);

    return () => {
      mounted = false;
      initializationInProgress = false;
      clearTimeout(debounceTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchUserData]);

  // ✅ OTIMIZADO: Listener de mudanças de auth com debounce e controle de estado
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    let isProcessing = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔄 Auth state change:', event, session?.user?.id);
        
        // Debounce para evitar múltiplas execuções
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(async () => {
          if (isProcessing) {
            console.log('⏳ Processamento já em andamento, ignorando evento:', event);
            return;
          }
          
          isProcessing = true;
          
          try {
            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                if (session?.user) {
                  console.log('✅ Processando login/refresh para:', session.user.email);
                  setSession(session);
                  setUser(session.user);
                  
                  try {
                    await fetchUserData(session.user.id, session);
                    console.log('✅ Dados do usuário atualizados após', event);
                  } catch (error) {
                    console.error('❌ Erro ao buscar dados do usuário após', event, ':', error);
                    // Não limpar sessão em caso de erro de rede
                    if (!error?.message?.includes('Network') && !error?.message?.includes('timeout')) {
                      console.warn('⚠️ Erro não relacionado à rede, mantendo sessão');
                    }
                  }
                } else {
                  console.warn('⚠️ Evento', event, 'sem sessão válida');
                }
                break;
                
              case 'SIGNED_OUT':
                console.log('🚪 Processando logout');
                clearSession();
                setLoading(false);
                break;
                
              case 'USER_UPDATED':
                if (session?.user) {
                  console.log('👤 Atualizando dados do usuário');
                  setUser(session.user);
                  setSession(session);
                } else {
                  console.warn('⚠️ USER_UPDATED sem sessão válida');
                }
                break;
                
              default:
                console.log('ℹ️ Evento de auth não tratado:', event);
            }
          } catch (error) {
            console.error('❌ Erro no processamento do evento de auth:', error);
            handleAuthError(error);
          } finally {
            isProcessing = false;
          }
        }, 100); // Debounce de 100ms
      }
    );

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserData, clearSession]);

  // ✅ NOVO: Sistema de heartbeat para manter sessão ativa
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;
    let isHeartbeatActive = false;
    
    const startHeartbeat = () => {
      if (isHeartbeatActive) return;
      
      isHeartbeatActive = true;
      console.log('💓 Iniciando heartbeat da sessão');
      
      heartbeatInterval = setInterval(async () => {
        if (!session?.user) {
          console.log('💓 Parando heartbeat - sem sessão');
          isHeartbeatActive = false;
          return;
        }
        
        try {
          // Verificar se a sessão ainda é válida
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('⚠️ Erro no heartbeat:', error);
            return;
          }
          
          if (!currentSession) {
            console.log('💓 Heartbeat detectou sessão expirada');
            clearSession();
            isHeartbeatActive = false;
            return;
          }
          
          // Verificar conectividade com o backend
          try {
            const response = await fetch('/api/health-check', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${currentSession.access_token}`,
              },
              signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
              console.warn('⚠️ Heartbeat: Backend não responsivo');
            } else {
              console.log('💓 Heartbeat: Sessão e backend OK');
            }
          } catch (fetchError) {
            console.warn('⚠️ Heartbeat: Erro de conectividade:', fetchError);
          }
          
        } catch (error) {
          console.error('❌ Erro no heartbeat:', error);
        }
      }, 30000); // Heartbeat a cada 30 segundos
    };
    
    const stopHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        isHeartbeatActive = false;
        console.log('💓 Heartbeat parado');
      }
    };
    
    // Iniciar heartbeat se há sessão ativa
    if (session?.user && !loading) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
    
    return () => {
      stopHeartbeat();
    };
  }, [session, loading, clearSession]);
  
  // ✅ NOVO: Verificação de sessão no foco da página
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && session?.user) {
        console.log('👁️ Página focada, verificando sessão...');
        
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession) {
            console.log('👁️ Sessão expirada detectada no foco');
            clearSession();
          } else {
            console.log('👁️ Sessão válida no foco');
          }
        } catch (error) {
          console.error('❌ Erro ao verificar sessão no foco:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, clearSession]);

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
