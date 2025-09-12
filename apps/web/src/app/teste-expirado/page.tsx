'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiCheckCircle, FiMail, FiMessageCircle } from 'react-icons/fi';
import Image from 'next/image';
import PixQRCode from '@/components/PixQRCode';
import { useSubscription } from '@/hooks/useSubscription';

export default function TesteExpiradoPage() {
  const router = useRouter();
  const { assinatura, isTrialExpired, loading } = useSubscription();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const [showPixPayment, setShowPixPayment] = useState(false);

  // Verificar se o trial realmente expirou
  useEffect(() => {
    if (!loading) {
      console.log('Estado de loading:', {
        loading: loading
      });

      // Se tem assinatura ativa ou trial não expirou, redirecionar para dashboard
      if (assinatura && !isTrialExpired()) {
        router.push('/dashboard');
        return;
      }

      // Se não tem assinatura, permanecer na página
      if (!assinatura) {
        return;
      }
    }
  }, [assinatura, isTrialExpired, loading, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const planos = [
    {
      id: 'unico',
      nome: 'Acesso Completo',
      preco: 'R$ 1,00',
      valor: 1.00,
      periodo: '/mês',
      descricao: 'Todos os recursos do sistema liberados',
      badge: 'Preço único para tudo',
      recursos: [
        'Cadastro de clientes, produtos e serviços',
        'Ordens de serviço completas com laudos e fotos',
        'Gestão de técnicos, equipes e comissões',
        'Relatórios e dashboards operacionais',
        'Controle de estoque e fornecedores',
        'Múltiplos usuários com permissões',
        'Backup e segurança em nuvem',
        'Integração de pagamentos (PIX e mais)',
        'Suporte prioritário por WhatsApp'
      ],
      destaque: true
    }
  ];

  const handleContatoSuporte = () => {
    const mensagem = encodeURIComponent('Olá! Meu teste grátis expirou e preciso de ajuda para escolher o melhor plano para continuar usando o sistema.');
    window.open(`https://wa.me/5511999999999?text=${mensagem}`, '_blank');
  };

  const handleEscolherPlano = (plano: any) => {
    router.push(`/planos/pagar/${plano.id || 'unico'}`);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    alert('Pagamento realizado com sucesso! Você será redirecionado para o sistema.');
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error);
    alert(`Erro no pagamento: ${error}`);
  };

  // Mostrar loading enquanto verifica o status
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1FE6E] mx-auto mb-4"></div>
          <p className="text-white/60">Verificando status do trial...</p>
        </div>
      </div>
    );
  }

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

      {/* Vagalume Effect */}
      <div 
        className="fixed pointer-events-none z-50 transition-transform duration-100 ease-out"
        style={{
          left: mousePosition.x - 25,
          top: mousePosition.y - 25,
          transform: 'translate(0, 0)'
        }}
      >
        <div className="w-12 h-12 bg-[#D1FE6E] rounded-full opacity-60 blur-sm animate-pulse"></div>
        <div className="w-8 h-8 bg-[#D1FE6E] rounded-full opacity-40 blur-sm animate-pulse absolute top-2 left-2"></div>
        <div className="w-4 h-4 bg-[#D1FE6E] rounded-full opacity-20 blur-sm animate-pulse absolute top-4 left-4"></div>
      </div>

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
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Início
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="text-white/80 hover:text-white transition-all duration-300 font-light text-lg tracking-wide"
            >
              Login
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
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 text-white border border-white/20 rounded-full font-medium hover:bg-white/10 transition-all duration-300"
            >
              Voltar ao Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-8 py-32 lg:px-12 lg:py-48">
        <div className="mx-auto max-w-5xl text-center">
          {/* Alert Badge */}
          <div className="inline-flex items-center px-8 py-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-full mb-16"
               style={{
                 boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)',
                 background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)'
               }}>
            <div className="w-3 h-3 bg-red-400 rounded-full mr-4 animate-pulse"></div>
            <span className="text-white/90 text-sm font-light tracking-wide">Teste Grátis Expirado</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-light mb-16 leading-none tracking-tight text-white">
            Seu teste grátis
            <span className="block font-medium text-gradient-secondary">expirou</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-white/80 mb-20 max-w-4xl mx-auto leading-relaxed font-light">
            Para continuar usando o sistema e aproveitar todos os recursos, escolha um dos nossos planos disponíveis.
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative z-10 px-8 py-32 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-6xl md:text-7xl font-light mb-8 leading-none tracking-tight text-white">
              Escolha seu plano
            </h2>
            <p className="text-white/70 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
              Para continuar usando o sistema, escolha o plano ideal para sua assistência
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {planos.map((plano, index) => (
              <div
                key={index}
                className={`group relative transition-all duration-500 ease-out hover:transform hover:scale-105 ${
                  plano.destaque ? 'md:transform md:scale-105' : ''
                }`}
              >
                <div 
                  className="h-full rounded-3xl p-8 border transition-all duration-500 ease-out hover:shadow-2xl flex flex-col relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                    border: plano.destaque ? '1px solid rgba(209, 254, 110, 0.3)' : '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plano.destaque ? 'from-[#D1FE6E]/10' : 'from-[#D1FE6E]/5'} to-transparent opacity-50`}></div>
                  
                  {/* Badge */}
                  <div className="relative z-10 mb-6">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      plano.destaque 
                        ? 'bg-[#D1FE6E]/20 text-[#D1FE6E]' 
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {plano.badge}
                    </span>
                  </div>

                  {/* Plan Info */}
                  <div className="relative z-10 flex-grow">
                    <div className="mb-4">
                      <h3 className="text-2xl font-light text-white mb-2">{plano.nome}</h3>
                      <p className="text-white/70 text-sm mb-6">{plano.descricao}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-light text-white">{plano.preco}</span>
                        <span className="text-white/60 text-sm ml-2">{plano.periodo}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plano.recursos.map((recurso, idx) => (
                        <li key={idx} className="flex items-center text-white/80">
                          <FiCheckCircle className="w-5 h-5 text-[#D1FE6E] mr-3 flex-shrink-0" />
                          <span className="text-sm font-light">{recurso}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleEscolherPlano(plano)}
                      className={`w-full py-4 px-6 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                        plano.destaque
                          ? 'bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] text-black hover:from-[#B8E55A] hover:to-[#A5D44A] shadow-lg'
                          : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                      style={{
                        boxShadow: plano.destaque ? '0 4px 20px rgba(209, 254, 110, 0.3)' : undefined
                      }}
                    >
                      Escolher {plano.nome}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suporte Section */}
          <div className="max-w-4xl mx-auto">
            <div 
              className="rounded-3xl p-8 border transition-all duration-500 ease-out hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
            >
              <div className="text-center">
                <h3 className="text-3xl font-light text-white mb-4">
                  Precisa de Ajuda?
                </h3>
                <p className="text-white/70 text-lg mb-8 font-light">
                  Nossa equipe está pronta para te ajudar a escolher o melhor plano e resolver qualquer dúvida sobre a expiração do seu teste grátis.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleContatoSuporte}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D1FE6E] to-[#B8E55A] text-black font-medium py-4 px-8 rounded-2xl hover:from-[#B8E55A] hover:to-[#A5D44A] transition-all duration-300 transform hover:scale-105"
                    style={{
                      boxShadow: '0 4px 20px rgba(209, 254, 110, 0.3)'
                    }}
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    Falar com Suporte
                  </button>
                  
                  <button
                    onClick={() => window.open('mailto:suporte@consert.com.br', '_blank')}
                    className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-medium py-4 px-8 rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                  >
                    <FiMail className="w-5 h-5" />
                    Enviar Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento PIX */}
      {showPixPayment && selectedPlano && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Pagamento via PIX
                </h3>
                <p className="text-gray-600">
                  Plano {selectedPlano.nome} - R$ {selectedPlano.valor.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <PixQRCode
                valor={selectedPlano.valor}
                descricao={`Plano ${selectedPlano.nome} - Teste Expirado`}
                onSuccess={() => handlePaymentSuccess('')}
                onError={handlePaymentError}
              />

              <button
                onClick={() => setShowPixPayment(false)}
                className="mt-4 w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 