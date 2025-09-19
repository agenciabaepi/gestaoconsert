"use client";

// AuthContext revisado para centralizar a lógica de sessão

// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { useSupabaseClient } from '@supabase/auth-helpers-react';
<<<<<<< HEAD
import { supabase, clearAuthData, isValidSession } from '@/lib/supabaseClient';
=======
import { supabase, forceLogout } from '@/lib/supabaseClient';
>>>>>>> stable-version
import { Session, User } from '@supabase/supabase-js';
// import { ToastProvider, useToast } from '@/components/Toast'; // Remover import de useToast/ToastProvider

interface UsuarioData {
  empresa_id: string;
  nome: string;
  email: string;
  nivel: string;
  permissoes?: string[];
  foto_url?: string;
}
interface EmpresaData {
  id: string;
  nome: string;
  plano: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuarioData: UsuarioData | null;
  empresaData: EmpresaData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggingOut: boolean;
  setIsLoggingOut: (value: boolean) => void;
  updateUsuarioFoto: (fotoUrl: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuarioData, setUsuarioData] = useState<UsuarioData | null>(null);
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [loading, setLoading] = useState(true);
  // Remover const { addToast } = useToast ? useToast() : { addToast: () => {} };

  // Função para limpar sessão e dados locais
  const clearSession = () => {
    setUser(null);
    setSession(null);
    setUsuarioData(null);
    setEmpresaData(null);
    localStorage.removeItem("user");
    clearAuthData();
  };

  useEffect(() => {
    const checkSession = async () => {
<<<<<<< HEAD
      console.log('AuthContext: Iniciando checkSession')
      
      try {
        // Primeiro verifica se a sessão é válida
        const isValid = await isValidSession();
        if (!isValid) {
          console.log('AuthContext: Sessão inválida, limpando dados');
          clearSession();
=======
      console.log('🔍 AuthContext: Iniciando checkSession')
      
      // Se já temos dados, não verificar novamente
      if (usuarioData && empresaData) {
        console.log('🔍 AuthContext: Dados já carregados, pulando verificação');
        setLoading(false);
        return;
      }
      
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Erro ao buscar sessão:', error.message);
        setLoading(false);
        return;
      }

      if (session) {
        console.log('AuthContext: Sessão encontrada, usuário:', session.user.email)
        setSession(session);
        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .select('empresa_id, nome, email, nivel, permissoes, foto_url')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();


        if (profileError || !profileData) {
          setUsuarioData(null);
          setEmpresaData(null);
          localStorage.removeItem("user");
>>>>>>> stable-version
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao buscar sessão:', error.message);
          
          // Se for erro de refresh token, limpa os dados
          if (error.message.includes('Refresh Token') || error.message.includes('Invalid')) {
            console.log('AuthContext: Refresh token inválido, limpando dados');
            clearSession();
          }
          
          setLoading(false);
          return;
        }

        if (session) {
          console.log('AuthContext: Sessão encontrada, usuário:', session.user.email)
          setSession(session);
          setUser(session.user);

          const { data: profileData, error: profileError } = await supabase
            .from('usuarios')
            .select('empresa_id, nome, email, nivel, permissoes, foto_url')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

          if (profileError || !profileData) {
            console.log('AuthContext: Erro ao buscar dados do usuário, limpando sessão');
            clearSession();
            setLoading(false);
            return;
          }

          if (!profileData.empresa_id) {
            setUsuarioData(profileData);
            setEmpresaData(null);
            setLoading(false);
            return;
          }

          setUsuarioData(profileData);
          localStorage.setItem("user", JSON.stringify({ ...session.user, ...profileData }));

          const metadataEmpresaId = session.user.user_metadata?.empresa_id;
          if (!metadataEmpresaId || metadataEmpresaId !== profileData.empresa_id) {
            await supabase.auth.updateUser({
              data: { empresa_id: profileData.empresa_id },
            });

            // Atualiza localmente a sessão sem forçar novo getSession()
            setSession((prev) =>
              prev
                ? {
                    ...prev,
                    user: {
                      ...prev.user,
                      user_metadata: {
                        ...prev.user.user_metadata,
                        empresa_id: profileData.empresa_id,
                      },
                    },
                  }
                : prev
            );
          }

          const { data: empresaInfo, error: empresaError } = await supabase
            .from("empresas")
            .select("id, nome, plano")
            .eq("id", profileData.empresa_id)
            .single();

          if (empresaError || !empresaInfo) {
            setEmpresaData(null);
          } else {
            setEmpresaData(empresaInfo);
          }

          console.log('AuthContext: Carregamento concluído com sucesso')
          setLoading(false);
        } else {
          console.log('AuthContext: Nenhuma sessão encontrada')
          clearSession();
          setLoading(false);
          return;
        }
<<<<<<< HEAD
      } catch (error) {
        console.error('AuthContext: Erro inesperado ao verificar sessão:', error);
        clearSession();
        setLoading(false);
=======

        setUsuarioData(profileData);
        localStorage.setItem("user", JSON.stringify({ ...session.user, ...profileData }));

        const metadataEmpresaId = session.user.user_metadata?.empresa_id;
        if (!metadataEmpresaId || metadataEmpresaId !== profileData.empresa_id) {
          await supabase.auth.updateUser({
            data: { empresa_id: profileData.empresa_id },
          });

          // Atualiza localmente a sessão sem forçar novo getSession()
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  user: {
                    ...prev.user,
                    user_metadata: {
                      ...prev.user.user_metadata,
                      empresa_id: profileData.empresa_id,
                    },
                  },
                }
              : prev
          );
        }

        const { data: empresaInfo, error: empresaError } = await supabase
          .from("empresas")
          .select("id, nome, plano")
          .eq("id", profileData.empresa_id)
          .single();


        if (empresaError || !empresaInfo) {
          setEmpresaData(null);
        } else {
          setEmpresaData(empresaInfo);
        }

        console.log('🔍 AuthContext: Carregamento concluído com sucesso')
        setLoading(false);
        setHasInitialized(true);
      } else {
        console.log('🔍 AuthContext: Nenhuma sessão encontrada')
        setLoading(false);
        setHasInitialized(true);
        return;
>>>>>>> stable-version
      }
    };

    checkSession();

<<<<<<< HEAD
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        clearSession();
      } else if (session) {
        setUser(session.user);
        setSession(session);
        // Recarrega dados do usuário e empresa
        await checkSession();
      } else {
        clearSession();
=======
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔍 onAuthStateChange disparado:', _event, session ? 'Sessão presente' : 'Sessão ausente');
      
      // Atualizar apenas o estado básico, não chamar checkSession novamente
      setUser(session?.user ?? null);
      setSession(session);
      
      // Se a sessão foi removida, limpar dados
      if (!session) {
        console.log('🔍 Sessão removida, limpando dados...');
        setUsuarioData(null);
        setEmpresaData(null);
        setLoading(false); // ✅ CORRIGIDO: Definir loading como false quando não há sessão
      }
      
      // NÃO chamar checkSession aqui para evitar loops
      // Só executar se não foi inicializado ainda
      if (!hasInitialized && session) {
        console.log('🔍 onAuthStateChange: Primeira execução, chamando checkSession');
        checkSession();
      } else {
        console.log('🔍 onAuthStateChange: Estado atualizado sem chamar checkSession');
>>>>>>> stable-version
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Erro no login:', error.message);
        throw new Error(error.message);
      }
      // O estado será atualizado automaticamente pelo onAuthStateChange
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: 'Novo usuário',
            empresa_id: null,
          },
        },
      });

      if (error || !data.user) {
        console.error('Erro no cadastro:', error?.message);
        throw new Error(error?.message || 'Erro desconhecido ao cadastrar.');
      }

      // Criação bem-sucedida no Supabase Auth, agora salvar na tabela 'usuarios'
      const { error: insertError } = await supabase.from('usuarios').insert([
        {
          auth_user_id: data.user.id,
          email: email,
          nome: 'Novo usuário',
          empresa_id: null, // será vinculada depois
        },
      ]);

      if (insertError) {
        console.error('Erro ao inserir na tabela usuarios:', insertError.message);
        throw new Error(insertError.message);
      }
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      throw error;
    }
  };

  const signOut = async (onError?: (msg: string) => void) => {
    console.log('🚨 signOut chamado!', {
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
      currentUser: user?.email
    });
    
    setIsLoggingOut(true);
    setLoading(false); // ✅ CORRIGIDO: Definir loading como false durante logout
    
    try {
<<<<<<< HEAD
      // Limpar dados locais primeiro
      clearSession();
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== 'Auth session missing!') {
        if (onError) onError(error.message);
        console.error('Erro ao sair:', error.message);
      }
      
      // Garantir que todos os dados sejam limpos
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Erro inesperado ao sair:', error);
      // Mesmo com erro, limpar dados locais
      clearSession();
      localStorage.clear();
      sessionStorage.clear();
=======
      // Limpar estado local imediatamente para evitar renderização do ProtectedArea
      setUser(null);
      setSession(null);
      setUsuarioData(null);
      setEmpresaData(null);
      
      // Logout simples e direto
      console.log('🔴 AuthContext: Executando logout...');
      
      // 1. Limpar estado local
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Fazer logout do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('⚠️ Erro no logout Supabase:', error.message);
      } else {
        console.log('✅ Logout Supabase realizado');
      }
      
      // 3. Forçar limpeza do estado
      await supabase.auth.setSession(null);
      
      // 4. Redirecionar para login
      window.location.href = '/login';
      
    } catch (error) {
      if (onError) onError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao sair:', error);
      // Mesmo com erro, forçar redirecionamento
      window.location.href = '/login';
>>>>>>> stable-version
    } finally {
      setIsLoggingOut(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Erro ao enviar email de recuperação:', error.message);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error);
      throw error;
    }
  };

  const updateUsuarioFoto = (fotoUrl: string) => {
    setUsuarioData((prev) => prev ? { ...prev, foto_url: fotoUrl } : prev);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      usuarioData, 
      empresaData, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      isLoggingOut, 
      setIsLoggingOut, 
      updateUsuarioFoto,
      clearSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const useUsuario = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUsuario deve ser usado dentro de um AuthProvider');
  }
  return { usuario: context.usuarioData, empresa: context.empresaData, loading: context.loading };
};
