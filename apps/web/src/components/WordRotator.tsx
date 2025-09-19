'use client';

import { useState, useEffect } from 'react';

interface WordRotatorProps {
  words: string[];
  interval?: number; // em milissegundos
  className?: string;
  textClassName?: string;
}

export default function WordRotator({ 
  words, 
  interval = 3000, 
  className = '',
  textClassName = ''
}: WordRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setDirection('up');
      
      // Aguarda a animação de saída terminar
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setDirection('down');
        setIsAnimating(false);
      }, 400); // Tempo da animação de saída
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      <span 
        className={`inline-block transition-all duration-700 ease-out ${
          isAnimating 
            ? direction === 'up'
              ? 'opacity-0 -translate-y-4 scale-95 blur-sm' 
              : 'opacity-0 translate-y-4 scale-95 blur-sm'
            : 'opacity-100 translate-y-0 scale-100 blur-0'
        } ${textClassName}`}
        style={{
          transformOrigin: 'center',
          willChange: 'transform, opacity, filter'
        }}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
} 