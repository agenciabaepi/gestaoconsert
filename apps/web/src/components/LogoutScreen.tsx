'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import logopreto from '@/assets/imagens/logopreto.png';

export default function LogoutScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Iniciando logout...');

  useEffect(() => {
    // Simular progresso para dar feedback visual
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5; // Progresso mais lento para dar tempo
      });
    }, 150);

    // Timeout de segurança - se demorar mais de 15 segundos, forçar redirecionamento
    const timeout = setTimeout(() => {
      window.location.replace('/login');
    }, 15000);

    // Atualizar status baseado no progresso
    const statusInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 20) {
          setStatus('Encerrando sessão...');
        } else if (prev < 40) {
          setStatus('Limpando dados locais...');
        } else if (prev < 60) {
          setStatus('Removendo cookies...');
        } else if (prev < 80) {
          setStatus('Finalizando logout...');
        } else if (prev < 95) {
          setStatus('Redirecionando...');
        } else {
          setStatus('Logout concluído!');
        }
        return prev;
      });
    }, 300);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Logo da empresa */}
        <div className="mb-8">
          <Image 
            src={logopreto} 
            alt="Consert Logo" 
            className="h-20 md:h-24 w-auto object-contain mx-auto"
            priority
          />
        </div>
        
        {/* Spinner animado */}
        <div className="animate-spin rounded-full h-16 md:h-20 w-16 md:w-20 border-4 border-gray-200 border-t-green-600 mx-auto mb-6">
        </div>
        
        {/* Texto principal */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Encerrando sessão...</h1>
        <p className="text-base md:text-lg text-gray-600 mb-2">{status}</p>
        <p className="text-sm text-gray-500">Aguarde, estamos processando com segurança...</p>
        
        {/* Barra de progresso */}
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-6 mx-auto overflow-hidden">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
          </div>
        </div>
        
        {/* Informação de segurança */}
        <p className="text-xs text-gray-400 mt-4">
          Seus dados estão sendo limpos com segurança
        </p>
        
        {/* Mensagem de redirecionamento */}
        {progress > 90 && (
          <p className="text-sm text-green-600 mt-2 font-medium animate-pulse">
            Redirecionando para o login...
          </p>
        )}
      </div>
    </div>
  );
}
