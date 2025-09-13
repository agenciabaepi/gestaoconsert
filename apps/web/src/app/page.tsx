'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import macbookImage from '../assets/imagens/macbook.svg';
import { supabase } from '@/lib/supabaseClient';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import UltraModernWordRotator from '@/components/UltraModernWordRotator';

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Hook para animações de scroll reveal
  const { isAnimated } = useScrollReveal();
  
  // Inicializa a posição do mouse com valores negativos para que o efeito não apareça inicialmente
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [scrollY, setScrollY] = useState(0);
  // --- Analytics Animation State ---
  const [showAnalyticsAnimation, setShowAnalyticsAnimation] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  // Animated numbers
  const [revenue, setRevenue] = useState(127);
  const [reduction, setReduction] = useState(45);
  const [satisfaction, setSatisfaction] = useState(89);
  const [numbersAnimated, setNumbersAnimated] = useState(false);
  
  // Carrossel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Verificar se usuário está logado e redirecionar se necessário
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        // Verificar se veio de um redirecionamento recente para evitar loops
        const lastRedirect = sessionStorage.getItem('lastRedirect');
        const now = Date.now();
        if (lastRedirect && (now - parseInt(lastRedirect)) < 10000) { // Aumentar para 10 segundos
          console.log('Redirecionamento recente detectado, aguardando...');
          setIsCheckingAuth(false);
          return;
        }
        
        // Adicionar verificação de URL atual para evitar loops
        if (window.location.pathname !== '/') {
          setIsCheckingAuth(false);
          return;
        }
        
        // Verificar se há sessão ativa com timeout reduzido
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000) // Reduzir para 2 segundos
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (session?.user) {
          // Se já está na página de destino, não redirecionar
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            setIsCheckingAuth(false);
            return;
          }
          
          // Marcar o redirecionamento com timestamp
          sessionStorage.setItem('lastRedirect', now.toString());
          
          // Adicionar delay antes do redirecionamento
          setTimeout(() => {
            router.replace('/dashboard');
          }, 500);
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        // Em caso de erro ou timeout, apenas parar o loading
        console.warn('Erro ao verificar autenticação:', error);
        setIsCheckingAuth(false);
      }
    };
    
    checkUserAndRedirect();
  }, [router]);

  // Auto-rotate do carrossel
  useEffect(() => {
    const carouselImages = 3; // número de cards
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % carouselImages);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseLeave = () => {
      setMousePosition({ x: -100, y: -100 });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // --- Analytics Section Observer (separado) ---
  useEffect(() => {
    if (!analyticsRef.current) return;
    
    const analyticsObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Reset e inicia animação
          setRevenue(0);
          setReduction(0);
          setSatisfaction(0);
          setHasAnimated(false);
          setNumbersAnimated(false);
          setShowAnalyticsAnimation(true);
        } else {
          // Reset quando sair da tela
          setShowAnalyticsAnimation(false);
        }
      });
    }, { 
      threshold: 0.2, // Trigger quando 20% da seção estiver visível
      rootMargin: '0px 0px -100px 0px' // Trigger mais cedo
    });
    
    analyticsObs.observe(analyticsRef.current);
    return () => analyticsObs.disconnect();
  }, []);

  // --- Animated Numbers Effect ---
  useEffect(() => {
    if (showAnalyticsAnimation && !hasAnimated) {
      const endRevenue = 127;
      const endReduction = 45;
      const endSatisfaction = 89;
      let frame = 0;
      const totalFrames = 60; // Mais frames para animação mais suave
      const duration = 1500; // Duração fixa
      const interval = duration / totalFrames;
      
      const animate = () => {
        frame++;
        // Função de easing para animação mais natural
        const progress = frame / totalFrames;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const newRevenue = Math.round(endRevenue * easeOutQuart);
        const newReduction = Math.round(endReduction * easeOutQuart);
        const newSatisfaction = Math.round(endSatisfaction * easeOutQuart);
        
        setRevenue(newRevenue);
        setReduction(newReduction);
        setSatisfaction(newSatisfaction);
        
        if (frame < totalFrames) {
          setTimeout(animate, interval);
        } else {
          setRevenue(endRevenue);
          setReduction(endReduction);
          setSatisfaction(endSatisfaction);
          setNumbersAnimated(true);
          setHasAnimated(true);
        }
      };
      
      // Pequeno delay para garantir que a seção está visível
      setTimeout(animate, 200);
    }
  }, [showAnalyticsAnimation, hasAnimated]);

  // Mostrar loading apenas durante verificação inicial
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cffb6d] to-[#e0ffe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-800">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(209, 254, 110, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(209, 254, 110, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
      </div>
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent opacity-20"></div>

      {/* Vagalume Effect - Só aparece quando o mouse está na tela e não no canto */}
      {mousePosition.x > 50 && mousePosition.y > 50 && (
        <div 
          className="fixed pointer-events-none z-50 transition-transform duration-100 ease-out"
          style={{
            left: mousePosition.x - 25,
            top: mousePosition.y - 25,
            transform: 'translate(0, 0)',
            opacity: 1
          }}
        >
          <div className="w-12 h-12 bg-[#D1FE6E] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="w-8 h-8 bg-[#D1FE6E] rounded-full opacity-40 blur-sm animate-pulse absolute top-2 left-2"></div>
          <div className="w-4 h-4 bg-[#D1FE6E] rounded-full opacity-20 blur-sm animate-pulse absolute top-4 left-4"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 lg:px-12 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center">
              <Image 
                src="/assets/imagens/logobranco.png" 
              alt="Consert Logo" 
              width={160} 
              height={160}
              className="transition-all duration-500 ease-out hover:scale-110 hover:brightness-110"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <button 
              onClick={() => scrollToSection('solucoes')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Soluções
            </button>
            <button 
              onClick={() => scrollToSection('analytics')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Analytics
            </button>
            <button 
              onClick={() => scrollToSection('precos')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Investimento
            </button>
            <button 
              onClick={() => scrollToSection('recursos')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Recursos
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => router.push('/cadastro')}
              className="px-8 py-3 text-black bg-[#D1FE6E] rounded-full font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
            >
              Começar Agora
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="px-8 py-3 text-white border border-white/20 rounded-full font-medium hover:bg-white/10 transition-all duration-300"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-black/90 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('solucoes')}
                className="text-white hover:text-[#D1FE6E] transition-colors duration-300 font-medium text-left"
              >
                Soluções
              </button>
              <button 
                onClick={() => scrollToSection('analytics')}
                className="text-white hover:text-[#D1FE6E] transition-colors duration-300 font-medium text-left"
              >
                Analytics
              </button>
              <button 
                onClick={() => scrollToSection('precos')}
                className="text-white hover:text-[#D1FE6E] transition-colors duration-300 font-medium text-left"
              >
                Preços
              </button>
              <button 
                onClick={() => scrollToSection('recursos')}
                className="text-white hover:text-[#D1FE6E] transition-colors duration-300 font-medium text-left"
              >
                Recursos
              </button>
              <div className="flex flex-col space-y-3 pt-4 border-t border-[#D1FE6E]/20">
                <button 
                  onClick={() => router.push('/cadastro')}
                  className="px-6 py-3 text-gray-900 bg-[#D1FE6E] rounded-lg font-semibold hover:bg-[#B8E55A] transition-all duration-300"
                >
                  Começar Agora
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Social Proof Badge */}
          <div 
            data-reveal="badge"
            className={`inline-flex items-center px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full mb-12 scroll-reveal-slide-up ${
              isAnimated('badge') ? 'animated' : ''
            }`}
            style={{
              boxShadow: '0 8px 32px rgba(209, 254, 110, 0.1)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            }}
          >
            <div className="w-3 h-3 bg-[#D1FE6E] rounded-full mr-4 animate-pulse"></div>
            <span className="text-white/90 text-sm font-light tracking-wide">+500 assistências confiam no Consert</span>
          </div>

          {/* Main Headline */}
          <h1 
            data-reveal="headline"
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light mb-8 md:mb-12 leading-tight tracking-tight scroll-reveal-slide-up text-gradient-primary ${
              isAnimated('headline') ? 'animated' : ''
            }`}
          >
            Sua assistência com:
            <span className="block font-medium text-gradient-secondary">
              <UltraModernWordRotator 
                words={['gestão inteligente', 'sistema completo', 'resultados reais', 'crescimento contínuo']}
                interval={3000}
                textClassName="text-gradient-secondary"
              />
            </span>
          </h1>

          {/* Sub-headline */}
          <div 
            data-reveal="subheadline"
            className={`text-lg sm:text-xl md:text-2xl text-white/80 mb-12 md:mb-16 max-w-4xl mx-auto leading-relaxed font-light scroll-reveal-slide-up delay-300 ${
              isAnimated('subheadline') ? 'animated' : ''
            }`}
          >
            Consert transforma oficinas em negócios lucrativos. Cada ordem de serviço 
            impulsiona eficiência, engajamento real e momentum da marca no piloto automático.
          </div>

          {/* CTA Buttons */}
          <div 
            data-reveal="cta"
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center scroll-reveal-slide-up delay-500 ${
              isAnimated('cta') ? 'animated' : ''
            }`}
          >
            <button 
              onClick={() => router.push('/login')}
              className="px-8 sm:px-10 md:px-12 py-4 md:py-5 bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] text-black rounded-full font-medium text-base md:text-lg hover:from-[#B8E55A] hover:to-[#A5D44A] transition-all duration-500 transform hover:scale-105 hover:shadow-2xl"
              style={{
                boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
              }}
            >
              Falar com Vendas
            </button>
            <button 
              onClick={() => router.push('/cadastro?plano=unico')}
              className="px-12 py-5 text-white border border-white/30 rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-500 backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </div>

      {/* Product Demo Section */}
      <div id="solucoes" className="relative z-10 px-4 sm:px-6 md:px-8 pb-20 md:pb-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center">
            {/* MacBook Image */}
            <div 
              data-reveal="macbook"
              className={`relative mb-20 flex justify-center scroll-reveal-scale scroll-reveal-delay-300 ${
                isAnimated('macbook') ? 'revealed' : ''
              }`}
            >
              <Image 
                src={macbookImage}
                alt="MacBook Pro with Consert" 
                width={1000} 
                height={750}
                className="w-full max-w-4xl transition-all duration-700 ease-out"
                priority
                style={{
                  transform: `scale(${1 + (scrollY * 0.0002)})`,
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                  transition: 'transform 0.1s ease-out'
                }}
              />
            </div>

                        {/* Seção Carrossel + Texto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
              
              {/* Lado Esquerdo - Carrossel de Cards */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md h-[600px] flex items-center justify-center">
                  {/* Cards do Carrossel */}
                  {[
                    {
                      title: 'Ordens de Serviço',
                      subtitle: 'Gestão Completa',
                      description: 'Controle total de ordens, status e acompanhamento em tempo real',
                      icon: '📋',
                      gradient: 'from-blue-500/20 via-purple-500/20 to-indigo-500/20'
                    },
                    {
                      title: 'Dashboard Analytics',
                      subtitle: 'Métricas em Tempo Real',
                      description: 'Relatórios detalhados e insights para tomada de decisões',
                      icon: '📊',
                      gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20'
                    },
                    {
                      title: 'Gestão de Clientes',
                      subtitle: 'Relacionamento Inteligente',
                      description: 'CRM completo com histórico e comunicação integrada',
                      icon: '👥',
                      gradient: 'from-orange-500/20 via-red-500/20 to-pink-500/20'
                    }
                  ].map((card, index) => {
                    const isActive = index === currentCardIndex;
                    const isPrev = index === (currentCardIndex - 1 + 3) % 3;
                    const isNext = index === (currentCardIndex + 1) % 3;
                    
                    let cardStyle = 'opacity-0 scale-75 translate-x-0 z-0';
                    
                    if (isActive) {
                      cardStyle = 'opacity-100 scale-100 translate-x-0 z-30';
                    } else if (isPrev) {
                      cardStyle = 'opacity-40 scale-90 -translate-x-8 z-20';
                    } else if (isNext) {
                      cardStyle = 'opacity-40 scale-90 translate-x-8 z-20';
                    }
                    
                    return (
                    <div
                      key={index}
                      className={`absolute transition-all duration-700 ease-in-out transform ${cardStyle}`}
                    >
                      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 shadow-2xl border border-gray-700/50 backdrop-blur-sm w-80 h-[500px] flex flex-col justify-center items-center text-center">
                        {/* Ícone */}
                        <div className="text-6xl mb-6">
                          {card.icon}
                        </div>
                        
                        {/* Título */}
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                          <span className="bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] bg-clip-text text-transparent">
                            {card.title}
                          </span>
                        </h3>
                        
                        {/* Subtítulo */}
                        <h4 className="text-lg text-gray-300 mb-4 font-light">
                          {card.subtitle}
                        </h4>
                        
                        {/* Descrição */}
                        <p className="text-gray-400 leading-relaxed text-sm">
                          {card.description}
                        </p>
                        
                        {/* Decoração */}
                        <div className="absolute top-6 right-6 w-3 h-3 bg-[#D1FE6E] rounded-full opacity-60"></div>
                        <div className="absolute bottom-6 left-6 w-2 h-2 bg-[#B8E55A] rounded-full opacity-40"></div>
                      </div>
                    </div>
                    );
                  })}

                  {/* Indicadores do Carrossel */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-40">
                    {[0, 1, 2].map((index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentCardIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentCardIndex 
                            ? 'bg-[#D1FE6E] scale-125 shadow-lg' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Lado Direito - Conteúdo Textual */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight tracking-tight text-white">
                    Funcionalidades que 
                    <span className="bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] bg-clip-text text-transparent font-medium">
                      {' '}transformam{' '}
                    </span>
                    seu negócio
                  </h2>
                  <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light">
                    Uma plataforma completa que integra todas as operações da sua assistência técnica em um só lugar.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#D1FE6E]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#D1FE6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-2">Gestão Inteligente</h3>
                      <p className="text-white/60 leading-relaxed">
                        Automação de processos que reduz erros e aumenta a produtividade da sua equipe.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#D1FE6E]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#D1FE6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-2">Performance Otimizada</h3>
                      <p className="text-white/60 leading-relaxed">
                        Interface responsiva e rápida, desenvolvida para máxima eficiência no dia a dia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#D1FE6E]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#D1FE6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-2">Segurança Garantida</h3>
                      <p className="text-white/60 leading-relaxed">
                        Seus dados protegidos com criptografia de ponta e backups automáticos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => router.push('/cadastro?plano=unico')}
                    className="inline-flex items-center px-8 py-4 bg-[#D1FE6E] text-black rounded-full font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    <span>Começar Agora</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div 
              data-reveal="demo-cta"
              className={`text-center max-w-lg scroll-reveal-slide-up scroll-reveal-delay-500 ${
                isAnimated('demo-cta') ? 'revealed' : ''
              }`}
            >
              <div className="flex items-center justify-center mb-8">
                <svg className="w-6 h-6 text-white/60 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span className="text-white/80 font-light text-lg tracking-wide">Veja em ação</span>
              </div>
              <p className="text-white/70 text-lg mb-10 leading-relaxed font-light">
                Interface intuitiva e completa para gerenciar sua assistência de forma eficiente.
              </p>
              <button 
                onClick={() => router.push('/cadastro?plano=unico')}
                className="px-10 py-4 bg-[#D1FE6E] text-black rounded-full font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                }}
              >
                Testar Agora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="recursos" className="relative z-10 px-4 sm:px-6 md:px-8 py-20 md:py-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div 
            data-reveal="features-header"
            className={`text-center mb-32 hero-reveal ${
              isAnimated('features-header') ? 'revealed' : ''
            }`}
          >
            <h2 className="text-6xl md:text-7xl font-light mb-12 leading-none tracking-tight text-gradient-accent">
              Tudo que sua assistência precisa
            </h2>
            <p className="text-white/70 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
              Uma plataforma completa com todas as ferramentas essenciais para modernizar sua assistência
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div 
              data-reveal="feature-1"
              className={`group h-full card-reveal ${
                isAnimated('feature-1') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-6 md:p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-lg md:text-xl mb-3 md:mb-4 tracking-wide">Ordens de Serviço</h3>
                <p className="text-white/80 leading-relaxed text-sm md:text-base font-light flex-grow">
                  Crie e gerencie ordens de serviço de forma simples e organizada. 
                  Acompanhe o progresso em tempo real.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div 
              data-reveal="feature-2"
              className={`group h-full card-reveal scroll-reveal-delay-100 ${
                isAnimated('feature-2') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-xl mb-4 tracking-wide">Gestão de Clientes</h3>
                <p className="text-white/80 leading-relaxed text-base font-light flex-grow">
                  Cadastre e acompanhe seus clientes com histórico completo. 
                  Histórico de serviços e veículos.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div 
              data-reveal="feature-3"
              className={`group h-full card-reveal scroll-reveal-delay-200 ${
                isAnimated('feature-3') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-xl mb-4 tracking-wide">Controle Financeiro</h3>
                <p className="text-white/80 leading-relaxed text-base font-light flex-grow">
                  Acompanhe receitas, despesas e lucros em tempo real. 
                  Relatórios financeiros detalhados.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div 
              data-reveal="feature-4"
              className={`group h-full card-reveal scroll-reveal-delay-300 ${
                isAnimated('feature-4') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-xl mb-4 tracking-wide">Relatórios Avançados</h3>
                <p className="text-white/80 leading-relaxed text-base font-light flex-grow">
                  Relatórios detalhados para tomar decisões estratégicas. 
                  Dashboards personalizáveis.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div 
              data-reveal="feature-5"
              className={`group h-full card-reveal scroll-reveal-delay-400 ${
                isAnimated('feature-5') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-xl mb-4 tracking-wide">Acesso Mobile</h3>
                <p className="text-white/80 leading-relaxed text-base font-light flex-grow">
                  Acesse o sistema de qualquer dispositivo, a qualquer hora. 
                  Interface responsiva e otimizada.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div 
              data-reveal="feature-6"
              className={`group h-full card-reveal scroll-reveal-delay-500 ${
                isAnimated('feature-6') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-white font-light text-xl mb-4 tracking-wide">Segurança Total</h3>
                <p className="text-white/80 leading-relaxed text-base font-light flex-grow">
                  Seus dados protegidos com a mais alta segurança. 
                  Backup automático e criptografia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <section id="analytics" ref={analyticsRef} className="relative z-10 px-4 sm:px-6 md:px-8 py-20 md:py-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-24">
            <h2 
              data-reveal="analytics-headline"
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light mb-6 md:mb-8 leading-tight tracking-tight hero-reveal text-gradient-accent ${
                isAnimated('analytics-headline') ? 'revealed' : ''
              }`}
            >
              Dados que impulsionam resultados
            </h2>
            <p 
              data-reveal="analytics-subheadline"
              className={`text-xl text-white/70 max-w-3xl mx-auto leading-relaxed font-light scroll-reveal-slide-up scroll-reveal-delay-300 ${
                isAnimated('analytics-subheadline') ? 'revealed' : ''
              }`}
            >
              Dashboards inteligentes que transformam números em insights acionáveis
            </p>
          </div>

          {/* Analytics Grid - Centralized Layout */}
          <div className="max-w-5xl mx-auto">
            {/* Charts Container */}
            <div 
              data-reveal="charts-container"
              className={`chart-reveal scroll-reveal-delay-200 ${
                isAnimated('charts-container') ? 'revealed' : ''
              }`}
            >
              <div className="relative">
                {/* Main Chart */}
                <div 
                  className="relative p-8 rounded-3xl mb-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Chart Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-medium text-white mb-2">Receita Mensal</h3>
                      <p className="text-white/60 text-sm">Últimos 6 meses</p>
                      <p className="text-white/40 text-xs mt-1">Crescimento médio de 15% ao mês</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#D1FE6E] rounded-full"></div>
                      <span className="text-white/80 text-sm">Crescimento</span>
                      <div className="ml-4 text-right">
                        <div className="text-white/60 text-xs">Total: R$ 247.5k</div>
                        <div className="text-[#D1FE6E] text-xs">+23.4% vs período anterior</div>
                      </div>
                    </div>
                  </div>

                  {/* Animated Bar Chart */}
                  <div className="relative h-80 flex items-end justify-between space-x-2 pl-12">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 25, 50, 75, 100].map((line) => (
                        <div key={line} className="border-t border-white/10 h-px"></div>
                      ))}
                    </div>
                    
                    {/* Y-axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-white/40 text-xs pointer-events-none w-12">
                      <span>R$ 50k</span>
                      <span>R$ 37.5k</span>
                      <span>R$ 25k</span>
                      <span>R$ 12.5k</span>
                      <span>R$ 0</span>
                    </div>
                    
                    {[65, 78, 82, 91, 88, 95].map((value, index) => (
                      <div key={index} className="flex-1 relative flex flex-col justify-end">
                        <div 
                          className="bg-gradient-to-t from-[#D1FE6E] to-[#B8E55A] rounded-t-lg"
                          style={{
                            height: `${Math.max(value, 10)}px`,
                            opacity: (showAnalyticsAnimation || hasAnimated) ? 1 : 0,
                            transform: (showAnalyticsAnimation || hasAnimated) ? 'scaleY(1)' : 'scaleY(0.3)',
                            transformOrigin: 'bottom',
                            transitionDelay: `${index * 100}ms`,
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            willChange: 'transform, opacity'
                          }}
                        ></div>
                        {/* Value on top of bar */}
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white/80 text-xs font-medium"
                          style={{
                            opacity: (showAnalyticsAnimation || hasAnimated) ? 1 : 0,
                            transitionDelay: `${index * 100 + 300}ms`,
                            transition: 'opacity 0.4s ease-out',
                            willChange: 'opacity'
                          }}
                        >
                          R$ {Math.round((value / 100) * 50)}k
                        </div>
                        <div className="text-white/60 text-xs text-center mt-2">
                          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {/* Pie Chart */}
                  <div 
                    className="p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <h4 className="text-white/80 text-sm mb-4">Distribuição de Serviços</h4>
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#D1FE6E"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset="75.36"
                          className="transition-all duration-1000 ease-out"
                          style={{
                            transform: (showAnalyticsAnimation || hasAnimated) ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transformOrigin: 'center'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">{(showAnalyticsAnimation || hasAnimated) ? '70%' : '0%'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div 
                    className="p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <h4 className="text-white/80 text-sm mb-4">Clientes Ativos</h4>
                    <div className="relative h-24">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <path
                          d="M0,30 L20,25 L40,20 L60,15 L80,10 L100,5"
                          fill="none"
                          stroke="#D1FE6E"
                          strokeWidth="2"
                          className="transition-all duration-1000 ease-out"
                          style={{
                            strokeDasharray: (showAnalyticsAnimation || hasAnimated) ? '200' : '0',
                            strokeDashoffset: (showAnalyticsAnimation || hasAnimated) ? '0' : '200'
                          }}
                        />
                        {[0, 20, 40, 60, 80, 100].map((x, i) => (
                          <circle
                            key={i}
                            cx={x}
                            cy={[30, 25, 20, 15, 10, 5][i]}
                            r="2"
                            fill="#D1FE6E"
                            className="transition-all duration-1000 ease-out"
                            style={{
                              opacity: (showAnalyticsAnimation || hasAnimated) ? '1' : '0',
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div 
                  data-reveal="analytics-content"
                  className={`grid grid-cols-1 md:grid-cols-3 gap-8 scroll-reveal-slide-up scroll-reveal-delay-400 ${
                    isAnimated('analytics-content') ? 'revealed' : ''
                  }`}
                >
                  {/* Metric 1 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-medium text-white mb-2 transition-all duration-500">
                      <span className={`transition-all duration-300 ${numbersAnimated ? 'animate-pulse' : ''}`}>
                        +{showAnalyticsAnimation ? revenue : 127}%
                      </span>
                    </h3>
                    <p className="text-white/70 text-sm">Crescimento na receita média mensal</p>
                  </div>

                  {/* Metric 2 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-medium text-white mb-2 transition-all duration-500">
                      <span className={`transition-all duration-300 ${numbersAnimated ? 'animate-pulse' : ''}`}>
                        -{showAnalyticsAnimation ? reduction : 45}%
                      </span>
                    </h3>
                    <p className="text-white/70 text-sm">Redução no tempo de atendimento</p>
                  </div>

                  {/* Metric 3 */}
                  <div className="flex flex-col items-center text-center p-6 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-medium text-white mb-2 transition-all duration-500">
                      <span className={`transition-all duration-300 ${numbersAnimated ? 'animate-pulse' : ''}`}>
                        +{showAnalyticsAnimation ? satisfaction : 89}%
                      </span>
                    </h3>
                    <p className="text-white/70 text-sm">Aumento na satisfação dos clientes</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-12">
                  <button 
                    onClick={() => router.push('/cadastro')}
                    className="px-8 py-4 bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] text-black rounded-full font-medium hover:from-[#B8E55A] hover:to-[#A5D44A] transition-all duration-500 transform hover:scale-105"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    Ver Dashboard Completo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <div id="precos" className="relative z-10 px-4 sm:px-6 md:px-8 py-20 md:py-32 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div 
            data-reveal="pricing-header"
            className={`text-center mb-20 hero-reveal ${
              isAnimated('pricing-header') ? 'revealed' : ''
            }`}
          >
            <h2 className="text-6xl md:text-7xl font-light mb-8 leading-none tracking-tight text-gradient-accent">
              Nossos valores
            </h2>
            <p className="text-white/70 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
              Acesso completo ao sistema por um valor único mensal
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Plano Básico */}
            <div 
              data-reveal="pricing-basic"
              className={`group relative card-reveal ${
                isAnimated('pricing-basic') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-6 md:p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                
                {/* Icon */}
                <div className="relative z-10 mb-4 md:mb-6">
                  <div 
                    className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{
                      boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                    }}
                  >
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="relative z-10 flex-grow">
                  <div className="mb-4">
                    <span className="inline-block px-2 py-0.5 bg-white/5 text-white/80 text-xs font-medium rounded mb-3">
                      Acesso completo ao sistema
                    </span>
                    <h3 className="text-xl md:text-2xl font-light text-white mb-2">Básico</h3>
                    <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-6">1 usuário, 1 técnico, sistema de OS completo</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-3xl md:text-4xl font-light text-white">R$ 1,00</span>
                      <span className="text-white/60 text-xs md:text-sm ml-2">/mês</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Cadastro de clientes</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Cadastro de produtos e serviços</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Sistema de OS completo</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Relatórios simples de atendimento</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Segurança de dados na nuvem</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="relative z-10 mt-auto">
                  <button 
                    onClick={() => router.push('/cadastro?plano=basico')}
                    className="w-full py-3 md:py-4 bg-[#D1FE6E] text-black rounded-2xl font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    Selecionado
                  </button>
                </div>
              </div>
            </div>

            {false && (
            <div 
              data-reveal="pricing-pro"
              className={`group relative card-reveal scroll-reveal-delay-100 ${
                isAnimated('pricing-pro') ? 'revealed' : ''
              }`}
            >
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black text-white px-4 py-2 rounded-full text-xs font-medium">
                  POPULAR
                </div>
              </div>

              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                  border: '2px solid rgba(209, 254, 110, 0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D1FE6E]/10 to-transparent opacity-60"></div>
                
                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div 
                    className="w-16 h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{
                      boxShadow: '0 8px 32px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h4a2 2 0 012 2v2m-8 0v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="relative z-10 flex-grow">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#D1FE6E]/20 text-[#D1FE6E] text-xs font-medium rounded-full mb-3">
                      Plano completo para equipes
                    </span>
                    <h3 className="text-2xl font-light text-white mb-2">Pro</h3>
                    <p className="text-white/70 text-sm mb-6">5 usuários, 5 técnicos e muito mais</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-light text-white">R$ 2,00</span>
                      <span className="text-white/60 text-sm ml-2">/mês</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Controle financeiro</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Comissão por técnico</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Emissão de nota fiscal</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Controle de permissões</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Controle de estoque detalhado</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Gestão de equipe por permissões</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="relative z-10 mt-auto">
                  <button 
                    onClick={() => router.push('/cadastro')}
                    className="w-full py-4 bg-[#D1FE6E] text-black rounded-2xl font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    Escolher Pro
                  </button>
                </div>
              </div>
            </div>
            )}

            {false && (
            <div 
              data-reveal="pricing-advanced"
              className={`group relative card-reveal scroll-reveal-delay-200 ${
                isAnimated('pricing-advanced') ? 'revealed' : ''
              }`}
            >
              <div 
                className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:transform hover:scale-105 group-hover:shadow-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D1FE6E]/5 to-transparent opacity-50"></div>
                
                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div 
                    className="w-16 h-16 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{
                      boxShadow: '0 8px 32px rgba(209, 254, 110, 0.2)'
                    }}
                  >
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="relative z-10 flex-grow">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#D1FE6E]/20 text-[#D1FE6E] text-xs font-medium rounded-full mb-3">
                      Experiência completa + automações
                    </span>
                    <h3 className="text-2xl font-light text-white mb-2">Avançado</h3>
                    <p className="text-white/70 text-sm mb-6">10 usuários, 10 técnicos, app e automações</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-light text-white">R$ 3,00</span>
                      <span className="text-white/60 text-sm ml-2">/mês</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Kanban para OS</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">App do técnico com notificações</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Integração WhatsApp</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Dashboard de performance</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[#D1FE6E] rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">Geração de relatórios personalizados</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="relative z-10 mt-auto">
                  <button 
                    onClick={() => router.push('/cadastro')}
                    className="w-full py-4 bg-[#D1FE6E] text-black rounded-2xl font-medium hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    Escolher Avançado
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Additional Info */}
          <div 
            data-reveal="pricing-info"
            className={`text-center mt-16 scroll-reveal-fade scroll-reveal-delay-300 ${
              isAnimated('pricing-info') ? 'revealed' : ''
            }`}
          >
            <p className="text-white/60 text-sm max-w-2xl mx-auto">
              Todos os planos incluem suporte por email e chat. Cancelamento a qualquer momento. 
              Teste grátis por 14 dias em todos os planos.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-8 py-32 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-16 border border-white/10">
            <h2 className="text-6xl md:text-7xl font-light text-white mb-8 leading-none tracking-tight">
              Pronto para transformar sua assistência?
            </h2>
            <p className="text-white/70 text-xl md:text-2xl mb-12 leading-relaxed font-light max-w-4xl mx-auto">
              Junte-se a centenas de assistências que já confiam no Consert para 
              gerenciar seus negócios de forma mais eficiente e lucrativa!
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <button 
                onClick={() => router.push('/cadastro')}
                className="px-12 py-5 bg-[#D1FE6E] text-black rounded-full font-medium text-lg hover:bg-[#B8E55A] transition-all duration-300 transform hover:scale-105"
              >
                Começar Agora
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="px-12 py-5 text-white border border-white/30 rounded-full font-medium text-lg hover:bg-white/10 transition-all duration-300"
              >
                Ver Demonstração
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Novo Design */}
      <footer className="relative z-10 px-8 py-16 lg:px-12 border-t border-white/10 bg-gradient-to-b from-transparent to-black/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          {/* Grid de 4 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Coluna 1 - Logo e Descrição */}
            <div className="flex flex-col items-center md:items-start">
              <Image 
                src="/assets/imagens/logobranco.png" 
                alt="CONSERT Logo" 
                width={180} 
                height={180}
                className="transition-all duration-500 ease-out hover:scale-105 hover:brightness-110 mb-6"
              />
              <p className="text-white/60 text-sm leading-relaxed mt-4 max-w-xs">
                Sistema completo para gestão de assistências técnicas. Simplifique processos, aumente a produtividade e encante seus clientes.
              </p>
              
              {/* Redes Sociais */}
              <div className="flex space-x-4 mt-6">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D1FE6E] hover:text-black transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D1FE6E] hover:text-black transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D1FE6E] hover:text-black transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D1FE6E] hover:text-black transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Coluna 2 - Links Rápidos */}
            <div>
              <h3 className="text-white font-medium text-lg mb-6">Links Rápidos</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="#recursos" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#planos" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Planos e Preços
                  </Link>
                </li>
                <li>
                  <Link href="#depoimentos" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Depoimentos
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Perguntas Frequentes
                  </Link>
                </li>
                <li>
                  <Link href="#blog" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Coluna 3 - Legal */}
            <div>
              <h3 className="text-white font-medium text-lg mb-6">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="#termos" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Termos de Serviço
                  </Link>
                </li>
                <li>
                  <Link href="#privacidade" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#cookies" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Política de Cookies
                  </Link>
                </li>
                <li>
                  <Link href="#lgpd" className="text-white/70 hover:text-[#D1FE6E] transition-colors duration-300 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Coluna 4 - Contato */}
            <div>
              <h3 className="text-white font-medium text-lg mb-6">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#D1FE6E] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-white/70">(11) 4002-8922</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#D1FE6E] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/70">contato@consert.com.br</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#D1FE6E] mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white/70">Av. Paulista, 1000<br />São Paulo, SP</span>
                </li>
              </ul>
              
              {/* Newsletter */}
              <div className="mt-8">
                <h4 className="text-white text-sm font-medium mb-3">Assine nossa newsletter</h4>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="bg-white/5 border border-white/10 rounded-l-md px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/50 w-full"
                  />
                  <button className="bg-[#D1FE6E] text-black px-4 rounded-r-md hover:bg-[#B8E55A] transition-colors duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Linha divisória */}
          <div className="border-t border-white/10 pt-8 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/50 text-sm font-light mb-4 md:mb-0">
                 © 2024 CONSERT. Todos os direitos reservados.
               </p>
              
              <div className="flex items-center space-x-6">
                <Link href="#" className="text-white/50 hover:text-white text-sm transition-colors duration-300">Termos</Link>
                <Link href="#" className="text-white/50 hover:text-white text-sm transition-colors duration-300">Privacidade</Link>
                <Link href="#" className="text-white/50 hover:text-white text-sm transition-colors duration-300">Cookies</Link>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/40 text-xs">
                 <span className="text-[#D1FE6E]">CONSERT</span> - Transformando assistências técnicas em negócios de sucesso desde 2022.
               </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}