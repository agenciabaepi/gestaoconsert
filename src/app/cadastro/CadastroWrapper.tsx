'use client';
import { Suspense } from 'react';
import CadastroEmpresa from './CadastroComponent';

export default function CadastroWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#cffb6d] to-[#e0ffe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <CadastroEmpresa />
    </Suspense>
  );
} 