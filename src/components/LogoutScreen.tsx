'use client';

import Image from 'next/image';
import logopreto from '@/assets/imagens/logopreto.png';

export default function LogoutScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center animate-fade-in">
      <div className="text-center">
        {/* Logo da empresa */}
        <div className="mb-8">
          <Image 
            src={logopreto} 
            alt="Consert Logo" 
            className="h-24 w-auto object-contain mx-auto"
            priority
          />
        </div>
        
        {/* Spinner animado */}
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-green-600 mx-auto mb-8"></div>
        
        {/* Texto principal */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Saindo...</h1>
        <p className="text-lg text-gray-600 mb-2">Encerrando sua sessão</p>
        <p className="text-sm text-gray-500">Redirecionando para o login</p>
        
        {/* Barra de progresso */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mt-8 mx-auto overflow-hidden">
          <div className="bg-green-600 h-2 rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
}
