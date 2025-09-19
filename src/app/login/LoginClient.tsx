'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import logo from '@/assets/imagens/logopreto.png';
import bgImage from '@/assets/imagens/background-login.png';
import { ToastProvider, useToast } from '@/components/Toast';
import { ConfirmProvider, useConfirm } from '@/components/ConfirmDialog';

function LoginClientInner() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  
  // Proteção client-side: redirecionar se já estiver logado
  useEffect(() => {
    // ✅ CORRIGIDO: Só redirecionar se realmente estiver logado e não estiver fazendo logout
    if (auth.user && auth.session && !auth.loading && !auth.isLoggingOut) {
      console.log('Usuário já logado, redirecionando para dashboard...');
      router.replace('/dashboard');
    }
  }, [auth.user, auth.session, auth.loading, auth.isLoggingOut, router]);
  
  // Se estiver carregando ou já logado, mostrar loading
  if (auth.loading || (auth.user && auth.session && !auth.isLoggingOut)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cffb6d] to-[#e0ffe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  console.log('Debug LoginClient - AuthContext:', {
    user: auth.user,
    session: auth.session,
    usuarioData: auth.usuarioData,
    empresaData: auth.empresaData,
    loading: auth.loading
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Debug login - iniciando login com:', loginInput);
    setIsSubmitting(true);
    let emailToLogin = loginInput;
    
    // Verificar se é email ou usuário
    if (!loginInput.includes('@')) {
      const username = loginInput.trim().toLowerCase();
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('email')
        .eq('usuario', username)
        .single();
      if (error || !usuario?.email) {
        setIsSubmitting(false);
        addToast('error', 'Usuário não encontrado. Verifique o nome de usuário.');
        return;
      }
      emailToLogin = usuario.email;
    }
    
    // Tentar fazer login
    const {
      data: { session },
      error
    } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    });
    
    if (error) {
      setIsSubmitting(false);
      if (error.message.includes('Invalid login credentials')) {
        addToast('error', 'E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (error.message.includes('Email not confirmed')) {
        addToast('error', 'E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        addToast('error', 'Erro ao fazer login. Tente novamente.');
      }
      return;
    }
    
    if (!session?.user) {
      setIsSubmitting(false);
      addToast('error', 'Erro ao autenticar usuário. Tente novamente.');
      return;
    }
    
    // Buscar dados do usuário
    const userId = session.user.id;
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('nivel')
      .eq('auth_user_id', userId)
      .single();
<<<<<<< HEAD
    
    if (perfilError || !perfil) {
      setIsSubmitting(false);
      addToast('error', 'Perfil de usuário não encontrado. Entre em contato com o suporte.');
      return;
=======
    if (perfil) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', userId)
        .single();
      if (!usuario || !usuario.empresa_id) {
        router.replace('/criar-empresa');
        return;
      }
      console.log('Debug login - empresa_id:', usuario.empresa_id);
      
              const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('status, motivobloqueio')
          .eq('id', usuario.empresa_id)
          .single();
        
      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError);
        addToast('error', 'Erro ao verificar status da empresa.');
        setIsSubmitting(false);
        return;
      }
      if (empresa?.status === 'bloqueado') {
        await confirm({
          title: 'Acesso bloqueado',
          message: empresa.motivobloqueio || 'Entre em contato com o suporte.',
          confirmText: 'OK',
        });
        return;
      }
      console.log('Debug login - Login bem-sucedido, redirecionando...');
      localStorage.setItem("user", JSON.stringify({
        id: userId,
        email: emailToLogin,
        nivel: perfil.nivel
      }));
      localStorage.setItem("empresa_id", usuario.empresa_id);
      console.log('Debug login - Dados salvos no localStorage, iniciando redirecionamento...');
  
      // Aguardar um momento para garantir que o estado seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
  
            // Redirecionar diretamente para o dashboard apropriado usando router.push
      console.log('Debug login - Executando redirecionamento direto...');
      if (perfil.nivel === 'tecnico') {
        router.push('/dashboard-tecnico');
      } else if (perfil.nivel === 'admin' || perfil.nivel === 'atendente') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }

      // ✅ CORRIGIDO: Removido o redirecionamento duplo que causava o loop
      console.log('Debug login - Redirecionamento concluído');
>>>>>>> stable-version
    }
    
    // Verificar empresa
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', userId)
      .single();
    
    if (usuarioError || !usuario) {
      setIsSubmitting(false);
      addToast('error', 'Dados do usuário incompletos. Entre em contato com o suporte.');
      return;
    }
    
    if (!usuario.empresa_id) {
      setIsSubmitting(false);
      addToast('info', 'Redirecionando para criação de empresa...');
      router.replace('/criar-empresa');
      return;
    }
    
    console.log('Debug login - empresa_id:', usuario.empresa_id);
    
    // Verificar status da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('status, motivobloqueio')
      .eq('id', usuario.empresa_id)
      .single();
    
    if (empresaError) {
      console.error('Erro ao buscar empresa:', empresaError);
      setIsSubmitting(false);
      addToast('error', 'Erro ao verificar status da empresa. Tente novamente.');
      return;
    }
    
    if (empresa?.status === 'bloqueado') {
      setIsSubmitting(false);
      await confirm({
        title: 'Acesso bloqueado',
        message: empresa.motivobloqueio || 'Entre em contato com o suporte.',
        confirmText: 'OK',
      });
      return;
    }
    
    // Login bem-sucedido
    console.log('Debug login - Login bem-sucedido, redirecionando...');
    addToast('success', 'Login realizado com sucesso! Redirecionando...');
    
    // Salvar dados no localStorage
    localStorage.setItem("user", JSON.stringify({
      id: userId,
      email: emailToLogin,
      nivel: perfil.nivel
    }));
    localStorage.setItem("empresa_id", usuario.empresa_id);
    
          // Aguardar um pouco para mostrar a mensagem de sucesso
      setTimeout(() => {
        // Redirecionar baseado no nível do usuário
        if (perfil.nivel === 'tecnico') {
          window.location.href = '/dashboard-tecnico';
        } else if (perfil.nivel === 'atendente') {
          window.location.href = '/dashboard-atendente';
        } else if (perfil.nivel === 'admin') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1500);
    
    setIsSubmitting(false);
  };

  const handlePasswordReset = async () => {
    if (!loginInput) {
      addToast('warning', 'Informe seu e-mail ou usuário para recuperar a senha.');
      return;
    }
    
    let emailToReset = loginInput;
    if (!loginInput.includes('@')) {
      const username = loginInput.trim().toLowerCase();
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('email')
        .eq('usuario', username)
        .single();
      if (error || !usuario?.email) {
        addToast('error', 'Usuário não encontrado. Verifique o nome de usuário.');
        return;
      }
      emailToReset = usuario.email;
    }
    
    setIsRecovering(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsRecovering(false);
    
    if (error) {
      if (error.message.includes('User not found')) {
        addToast('error', 'Usuário não encontrado. Verifique o e-mail informado.');
      } else if (error.message.includes('Email not confirmed')) {
        addToast('error', 'E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        addToast('error', 'Erro ao enviar e-mail de recuperação. Tente novamente.');
      }
    } else {
      addToast('success', 'E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cffb6d] to-[#e0ffe3] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage.src}
          alt="Background Login"
          className="w-full h-full object-cover opacity-40"
          style={{ mixBlendMode: 'overlay' }}
        />
      </div>
      
      {/* Enhanced Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent"></div>

      {/* Login Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo with Enhanced Animation */}
          <div className="flex justify-center mb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
              <Image 
                src={logo} 
                alt="Consert Logo" 
                width={160} 
                height={160}
                className="relative transition-all duration-500 ease-out hover:scale-110 hover:brightness-110"
              />
            </div>
          </div>

          {/* Modern Login Form */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
            
            <form
              onSubmit={handleLogin}
              className="relative bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-white/30 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
                  Bem-vindo de volta
                </h1>
                <p className="text-gray-600 font-light">
                  Acesse sua conta para continuar
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Email/Username Input */}
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    focusedField === 'login' 
                      ? 'bg-gradient-to-r from-[#D1FE6E]/20 to-[#B8E55A]/20' 
                      : 'bg-white/50'
                  }`} />
                  <input
                    type="text"
                    placeholder="E-mail ou Usuário"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    onFocus={() => setFocusedField('login')}
                    onBlur={() => setFocusedField(null)}
                    className="relative w-full px-6 py-4 bg-transparent border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#D1FE6E] focus:ring-2 focus:ring-[#D1FE6E]/20 transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                </div>
                
                {/* Password Input */}
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    focusedField === 'password' 
                      ? 'bg-gradient-to-r from-[#D1FE6E]/20 to-[#B8E55A]/20' 
                      : 'bg-white/50'
                  }`} />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="relative w-full px-6 py-4 bg-transparent border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#D1FE6E] focus:ring-2 focus:ring-[#D1FE6E]/20 transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                </div>
                
                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] text-black font-medium py-4 rounded-2xl hover:from-[#B8E55A] hover:to-[#A5D44A] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  disabled={isSubmitting}
                  style={{
                    boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </span>
                </button>
                
                {/* Forgot Password Button */}
                <button
                  type="button"
                  className="w-full bg-gray-100 border border-gray-200 text-gray-700 font-medium py-4 rounded-2xl hover:bg-gray-200 hover:border-gray-300 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePasswordReset}
                  disabled={isRecovering}
                >
                  {isRecovering ? 'Enviando...' : 'Esqueci minha senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <ConfirmProvider>
      <ToastProvider>
        <LoginClientInner />
      </ToastProvider>
    </ConfirmProvider>
  );
}