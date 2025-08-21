'use client';

import { useState, useEffect } from 'react';

interface WordRotator3DProps {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}

export default function WordRotator3D({ 
  words, 
  interval = 3000, 
  className = '',
  textClassName = ''
}: WordRotator3DProps) {
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
      }, 400); // Metade do tempo da animação
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  const getTransformClasses = () => {
    if (!isAnimating) {
      return 'opacity-100 translate-y-0 rotate-x-0 scale-100';
    }

    if (direction === 'up') {
      return 'opacity-0 -translate-y-6 rotate-x-12 scale-95';
    } else {
      return 'opacity-100 translate-y-0 rotate-x-0 scale-100';
    }
  };

  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <span 
        className={`inline-block transition-all duration-800 ease-out transform ${getTransformClasses()} ${textClassName}`}
        style={{
          transformOrigin: 'center bottom',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden'
        }}
      >
        {words[currentIndex]}
      </span>
    </div>
  );
} 