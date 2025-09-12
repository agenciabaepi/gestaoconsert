'use client';

import { useState, useEffect } from 'react';

export default function SimpleWordRotatorTest() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = ['Profissional', 'Criativo', 'Inovador', 'Eficiente'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <div className="min-h-screen bg-black p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl text-white mb-8">
          <span className="text-white/70">Sou </span>
          <span className="text-[#D1FE6E] font-medium">
            {words[currentIndex]}
          </span>
        </h1>
        
        <div className="text-sm text-white/50 mt-8">
          <p>Teste simples de rotação de palavras</p>
          <p>Palavra atual: {currentIndex + 1} de {words.length}</p>
        </div>
      </div>
    </div>
  );
} 