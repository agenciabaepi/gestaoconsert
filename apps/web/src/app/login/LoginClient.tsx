'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import logo from '@/assets/imagens/logopreto.png';
import { ToastProvider, useToast } from '@/components/Toast';
import { ConfirmProvider, useConfirm } from '@/components/ConfirmDialog';
import { FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

function LoginClientInner() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Estados para verificação de código
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  const router = useRouter();
  const auth = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  
  // Imagens para o carrossel
  const carouselImages = [
    {
      src: '/assets/imagens/pageordens.png',
      alt: 'Consert Dashboard',
      title: 'Potencialize',
      subtitle: 'sua gestão de assistência técnica',
      description: 'Sistema completo para controle de ordens de serviço, clientes e equipe técnica com interface moderna e intuitiva.',
      isScreenshot: true
    },
    {
      src: '/assets/imagens/logobranco.png',
      alt: 'Consert Analytics',
      title: 'Analytics',
      subtitle: 'em tempo real',
      description: 'Acompanhe métricas importantes, relatórios detalhados e tome decisões baseadas em dados reais do seu negócio.',
      isScreenshot: false
    },
    {
      src: '/assets/imagens/logobranco.png',
      alt: 'Consert Mobile',
      title: 'Mobilidade',
      subtitle: 'total para sua equipe',
      description: 'Acesse o sistema de qualquer dispositivo, mantenha a produtividade e gerencie tudo de onde estiver.',
      isScreenshot: false
    }
  ];
  
  // 🔒 BLOQUEIO TOTAL: Usuários logados NÃO podem acessar a página de login
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isRedirecting = false;
    
    const checkAuthAndRedirect = () => {
      // Verificar se já está redirecionando para evitar múltiplas tentativas
      if (isRedirecting) {
        return;
      }
      
      // Verificar se veio de um redirecionamento recente
      const lastRedirect = sessionStorage.getItem('loginRedirect');
      const now = Date.now();
      if (lastRedirect && (now - parseInt(lastRedirect)) < 15000) { // Aumentar para 15 segundos
        console.log('Redirecionamento de login recente detectado, aguardando...');
        return;
      }
      
      // Verificar se já está na página de destino
      if (window.location.pathname === '/dashboard') {
        return;
      }
      
      // Se o usuário já estiver logado e não estiver em loading
      if (auth.user && auth.session && !auth.loading && auth.usuarioData) {
        // Verificar se a URL atual é realmente /login
        if (window.location.pathname !== '/login') {
          return;
        }
        
        isRedirecting = true;
        
        // Marcar redirecionamento
        sessionStorage.setItem('loginRedirect', now.toString());
        
        // Usar replace com delay maior e verificação adicional
        timeoutId = setTimeout(() => {
          // Verificar novamente antes de redirecionar
          if (window.location.pathname === '/login' && !window.location.pathname.includes('/dashboard')) {
            try {
              router.replace('/dashboard');
            } catch (error) {
              console.error('Erro no redirecionamento:', error);
              isRedirecting = false;
            }
          } else {
            isRedirecting = false;
          }
        }, 1500); // Aumentar delay para 1.5 segundos
      }
    };
    
    // Adicionar debounce maior para evitar múltiplas verificações
    const debounceTimeout = setTimeout(checkAuthAndRedirect, 800);
    
    return () => {
      clearTimeout(debounceTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      isRedirecting = false;
    };
  }, [auth.user, auth.session, auth.loading, auth.usuarioData, router]);

  // Auto-rotate do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);
  
  // Verificar se deve mostrar modo de verificação
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const email = searchParams.get('email');
    const verificacao = searchParams.get('verificacao');
    
    if (email && verificacao === 'pending') {
      setPendingEmail(email);
      setShowVerification(true);
    }
  }, []);
  
  // 🔒 CORREÇÃO DE HIDRATAÇÃO: Aguardar montagem no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🔒 PROTEÇÃO EXTRA: Se já estiver logado, não renderizar NADA
  if (auth.user && auth.session && !auth.loading && auth.usuarioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cffb6d] to-[#e0ffe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }
  
  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      addToast('error', 'Digite o código de 6 dígitos');
      return;
    }

    setVerifyingCode(true);

    try {
      const response = await fetch('/api/email/verificar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingEmail,
          codigo: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        addToast('success', 'Email verificado com sucesso! Agora você pode fazer login.');
        // Limpar URL e voltar para modo de login
        window.history.replaceState({}, '', '/login');
        setShowVerification(false);
        setVerificationCode('');
        setPendingEmail('');
        // Limpar campos do formulário de login
        setLoginInput('');
        setPassword('');
      } else {
        addToast('error', data.error || 'Código inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      addToast('error', 'Erro ao verificar código');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setVerifyingCode(true);

    try {
      const response = await fetch('/api/email/reenviar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingEmail })
      });

      const data = await response.json();

      if (response.ok) {
        addToast('success', 'Novo código enviado para seu email!');
      } else {
        addToast('error', data.error || 'Erro ao reenviar código');
      }
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      addToast('error', 'Erro ao reenviar código');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleTestarEmail = async () => {
    setVerifyingCode(true);

    try {
      const response = await fetch('/api/email/teste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingEmail })
      });

      const data = await response.json();

      if (response.ok) {
        addToast('success', 'Teste de email realizado com sucesso!');
      } else {
        addToast('error', data.error || 'Erro no teste de email');
      }
    } catch (error) {
      console.error('Erro no teste de email:', error);
      addToast('error', 'Erro no teste de email');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 🔒 PROTEÇÃO: Evitar múltiplas execuções simultâneas
    if (isSubmitting) {
      return;
    }
    
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
    
    // 🔒 VERIFICAÇÃO CRÍTICA: Verificar se o email foi confirmado ANTES de tentar login
    const { data: usuarioVerificacao, error: verificacaoError } = await supabase
      .from('usuarios')
      .select('email_verificado, auth_user_id, nivel, empresa_id')
      .eq('email', emailToLogin)
      .single();
    
    if (verificacaoError) {
      setIsSubmitting(false);
      addToast('error', 'Usuário não encontrado. Verifique suas credenciais.');
      return;
    }
    
    // Se o usuário é ADMIN (criador da empresa), verificar se o email foi confirmado
    if (usuarioVerificacao?.nivel === 'admin' && !usuarioVerificacao?.email_verificado) {
      setIsSubmitting(false);
      setPendingEmail(emailToLogin);
      setShowVerification(true);
      addToast('warning', 'Email não verificado. Digite o código enviado para seu email.');
      return;
    }
    
    // Se o usuário NÃO é admin, verificar se o ADMIN da empresa foi verificado
    if (usuarioVerificacao?.nivel !== 'admin' && usuarioVerificacao?.empresa_id) {
      // Buscar o admin da empresa para verificar se ele foi verificado
      const { data: adminEmpresa, error: adminError } = await supabase
        .from('usuarios')
        .select('email_verificado')
        .eq('empresa_id', usuarioVerificacao.empresa_id)
        .eq('nivel', 'admin')
        .single();
      
      if (adminError) {
        console.error('🔍 Debug - Erro ao buscar admin da empresa:', adminError);
        setIsSubmitting(false);
        addToast('error', 'Erro ao verificar empresa. Tente novamente.');
        return;
      }
      
      // Se o admin da empresa não foi verificado, o usuário não pode fazer login
      if (!adminEmpresa?.email_verificado) {
        setIsSubmitting(false);
        addToast('error', 'Empresa não verificada. Entre em contato com o administrador.');
        return;
      }
      
      }
    
    // Tentar fazer login (apenas se email foi verificado)
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
    
    if (perfilError || !perfil) {
      setIsSubmitting(false);
      addToast('error', 'Erro ao buscar perfil do usuário. Tente novamente.');
      return;
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
    addToast('success', 'Login realizado com sucesso! Redirecionando...');
    
    // 🔒 LIMPEZA COMPLETA: Limpar dados antigos antes de salvar novos
    try {
      // Limpar dados de sessão anteriores
      localStorage.removeItem('user');
      localStorage.removeItem('empresa_id');
      localStorage.removeItem('session');
      
      // Limpar sessionStorage
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
      
      // Aguardar um pouco para limpeza ser processada
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn('Erro na limpeza de dados:', error);
    }
    
    // Salvar dados novos no localStorage
    localStorage.setItem("user", JSON.stringify({
      id: userId,
      email: emailToLogin,
      nivel: perfil.nivel
    }));
    localStorage.setItem("empresa_id", usuario.empresa_id);
    
          // Aguardar um pouco para mostrar a mensagem de sucesso
      setTimeout(() => {
      // Redirecionar para dashboard principal
      router.push('/dashboard');
      }, 1500);
    
    // Resetar o estado de loading após o redirecionamento
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Carrossel de Cards */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Cards Sobrepostos */}
        <div className="relative w-full h-full flex items-center justify-center p-8">
          {carouselImages.map((image, index) => {
            const isActive = index === currentImageIndex;
            const isPrev = index === (currentImageIndex - 1 + carouselImages.length) % carouselImages.length;
            const isNext = index === (currentImageIndex + 1) % carouselImages.length;
            
            let cardStyle = 'opacity-0 scale-75 translate-x-0 z-0';
            
            if (isActive) {
              cardStyle = 'opacity-100 scale-100 translate-x-0 z-30';
            } else if (isPrev) {
              cardStyle = 'opacity-40 scale-90 -translate-x-16 z-20';
            } else if (isNext) {
              cardStyle = 'opacity-40 scale-90 translate-x-16 z-20';
            }
            
            return (
              <div
                key={index}
                className={`absolute transition-all duration-700 ease-in-out transform ${cardStyle}`}
              >
                {/* Card Principal */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-16 shadow-2xl border border-gray-700/50 backdrop-blur-sm w-[480px] h-[650px] flex flex-col justify-center items-center text-center">
                  {/* Ícone Grande */}
                  <div className="text-8xl mb-8 opacity-90">
                    {index === 0 ? '📋' : index === 1 ? '📊' : '🚀'}
                  </div>
                  
                  {/* Título */}
                  <h1 className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                    <span className="bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] bg-clip-text text-transparent">
                      {image.title}
                    </span>
                  </h1>
                  
                  {/* Subtítulo */}
                  <h2 className="text-2xl text-white/90 mb-8 font-light">
                    {image.subtitle}
                  </h2>
                  
                  {/* Descrição */}
                  <p className="text-white/70 leading-relaxed text-lg max-w-md">
                    {image.description}
                  </p>
                  
                  {/* Features List */}
                  <div className="mt-8 space-y-3">
                    {index === 0 && (
                      <>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Controle total de status</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Histórico completo</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Notificações automáticas</span>
                        </div>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Relatórios detalhados</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Métricas de performance</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Dashboard intuitivo</span>
                        </div>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Acesso em qualquer lugar</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Interface responsiva</span>
                        </div>
                        <div className="flex items-center text-white/60 text-sm">
                          <div className="w-2 h-2 bg-[#D1FE6E] rounded-full mr-3"></div>
                          <span>Sincronização em tempo real</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Decoração */}
                  <div className="absolute top-8 right-8 w-4 h-4 bg-[#D1FE6E] rounded-full opacity-60"></div>
                  <div className="absolute bottom-8 left-8 w-3 h-3 bg-[#B8E55A] rounded-full opacity-40"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controles do Carrossel */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-6 z-40">
          <button
            onClick={prevImage}
            className="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-white hover:bg-gray-700/80 hover:border-[#D1FE6E]/50 transition-all duration-300 flex items-center justify-center"
          >
            <FaArrowLeft className="text-lg" />
          </button>
          
          <button
            onClick={nextImage}
            className="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-white hover:bg-gray-700/80 hover:border-[#D1FE6E]/50 transition-all duration-300 flex items-center justify-center"
          >
            <FaArrowRight className="text-lg" />
          </button>
        </div>

        {/* Indicadores de página */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-4 z-40">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-[#D1FE6E] scale-125 shadow-lg' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <div className="relative group">
              <Image 
                src={logo} 
                alt="Consert Logo" 
                width={140} 
                height={140}
                className="transition-all duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Login Form */}
          <div className="relative">
            {showVerification ? (
              // Formulário de verificação de código
              <form
                onSubmit={handleVerificarCodigo}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
                    Verificar Email
                  </h1>
                  <p className="text-gray-600 font-light">
                    Como administrador, seu email precisa ser verificado.
                  </p>
                  <p className="text-gray-600 font-light">
                    Digite o código enviado para:
                  </p>
                  <p className="text-blue-600 font-medium mt-1">
                    {pendingEmail}
                  </p>
                </div>
                
                <div className="space-y-5">
                  {/* Código de Verificação Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Verificação
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={() => setFocusedField('code')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-200 text-center text-lg font-mono ${
                        focusedField === 'code' 
                          ? 'border-gray-900 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  {/* Verificar Button */}
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    disabled={verifyingCode}
                  >
                    {verifyingCode ? 'Verificando...' : 'Verificar Código'}
                  </button>
                  
                  {/* Reenviar Código Button */}
                  <button
                    type="button"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleReenviarCodigo}
                    disabled={verifyingCode}
                  >
                    {verifyingCode ? 'Enviando...' : 'Reenviar código'}
                  </button>
                  
                  {/* Testar Email Button */}
                  <button
                    type="button"
                    className="w-full bg-blue-100 text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={handleTestarEmail}
                    disabled={verifyingCode}
                  >
                    {verifyingCode ? 'Testando...' : 'Testar configuração de email'}
                  </button>
                  
                  {/* Voltar para Login */}
                  <button
                    type="button"
                    className="w-full text-blue-600 font-medium py-2 hover:text-blue-700 transition-colors"
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationCode('');
                      setPendingEmail('');
                      window.history.replaceState({}, '', '/login');
                    }}
                  >
                    ← Voltar para o login
                  </button>
                </div>

                {/* Informações */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-600 text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Código válido por 24 horas</p>
                      <p className="text-yellow-700 mt-1">Verifique sua caixa de spam se não encontrar o email.</p>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              // Formulário de login normal
            <form
              onSubmit={handleLogin}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
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
              
                <div className="space-y-5">
                {/* Email/Username Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail ou Usuário
                    </label>
                  <input
                    type="text"
                      placeholder="Digite seu e-mail ou usuário"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    onFocus={() => setFocusedField('login')}
                    onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                        focusedField === 'login' 
                          ? 'border-gray-900 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    required
                  />
                </div>
                
                {/* Password Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                  <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-200 pr-12 ${
                        focusedField === 'password' 
                          ? 'border-gray-900 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    required
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors mt-8"
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                </div>
                
                {/* Login Button */}
                <button
                  type="submit"
                    className="w-full bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  disabled={isSubmitting}
                    onClick={(e) => {
                      // Prevenir múltiplos cliques e validar campos
                      if (isSubmitting || !loginInput.trim() || !password.trim()) {
                        e.preventDefault();
                        if (!loginInput.trim() || !password.trim()) {
                          addToast('warning', 'Por favor, preencha todos os campos');
                        }
                        return;
                      }
                    }}
                  >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Entrando...
                        </div>
                      ) : (
                        'Entrar'
                      )}
                </button>
                
                {/* Forgot Password Button */}
                <button
                  type="button"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePasswordReset}
                  disabled={isRecovering}
                >
                  {isRecovering ? 'Enviando...' : 'Esqueci minha senha'}
                </button>
              </div>

                {/* Link para cadastro */}
                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/cadastro')}
                      className="text-gray-900 hover:text-gray-700 font-medium underline transition-colors"
                    >
                      Crie a sua agora
                    </button>
                  </p>
                </div>
            </form>
            )}
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8 space-x-6 text-sm">
            <a href="/privacidade" className="text-gray-500 hover:text-gray-700 transition-colors">
              Política de Privacidade
            </a>
            <a href="/termos" className="text-gray-500 hover:text-gray-700 transition-colors">
              Termos de Uso
            </a>
            <a href="/ajuda" className="text-gray-500 hover:text-gray-700 transition-colors">
              Ajuda
            </a>
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