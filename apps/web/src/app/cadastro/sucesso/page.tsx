'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/assets/imagens/logobranco.png';
import { FiCheckCircle, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function CadastroSucessoPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 4000);

    // Timer separado para redirecionamento
    const redirectTimer = setTimeout(() => {
      router.push('/login');
    }, 40000); // 10 segundos

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 bg-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `linear-gradient(rgba(209,254,110,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(209,254,110,0.08) 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/60" />
      </div>
      
      <div className="relative z-20 w-full max-w-2xl space-y-6">
        <div className="flex justify-center mb-6">
          <Image src={logo} alt="" width={200} height={60} priority className="mx-auto" />
        </div>
        
        <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl border" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
          <div className="text-center mb-8">
            <FiCheckCircle className="w-20 h-20 text-[#D1FE6E] mx-auto mb-4" />
            <h1 className="text-3xl font-light text-white mb-4">Cadastro concluído!</h1>
            <p className="text-white/70 mb-6">
              Sua empresa foi criada e você tem acesso ao sistema por 15 dias gratuitamente.
            </p>
          </div>

          <div className="rounded-lg p-6 mb-6 border" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h2 className="text-lg font-medium text-white mb-4">Próximos passos</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiMail className="w-5 h-5 text-[#D1FE6E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">1. Verifique seu e-mail</h3>
                  <p className="text-sm text-white/70">
                    Enviamos um e-mail de confirmação para você ativar sua conta.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FiLock className="w-5 h-5 text-[#D1FE6E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">2. Faça login</h3>
                  <p className="text-sm text-white/70">
                    Use o e-mail e senha que você cadastrou para acessar o sistema.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FiArrowRight className="w-5 h-5 text-[#D1FE6E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text.white">3. Comece a usar</h3>
                  <p className="text-sm text-white/70">
                    Explore todas as funcionalidades disponíveis no seu plano.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 mb-6 border" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h2 className="text-lg font-medium text-white mb-2">Informações importantes</h2>
            <ul className="text-sm text-white/70 space-y-2">
              <li>• Seu período de teste é de 15 dias gratuitos</li>
              <li>• Você pode fazer login com seu e-mail e senha</li>
              <li>• Todos os dados estão seguros na nuvem</li>
              <li>• Suporte disponível durante o período de teste</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => router.push('/login')} className="flex-1 bg-[#D1FE6E] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#B8E55A] transition flex items-center justify-center gap-2">
              <FiArrowRight className="w-4 h-4" />
              Ir para o Login
            </button>
            
            <button onClick={() => router.push('/planos')} className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-medium border border-white/20 hover:bg-white/15 transition">
              Ver Planos
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              Redirecionamento automático em <span className="font-medium text-white">{countdown}</span> segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 