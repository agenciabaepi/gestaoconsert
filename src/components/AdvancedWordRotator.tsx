'use client';

import { useState, useEffect } from 'react';

interface AdvancedWordRotatorProps {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  animationDuration?: number;
}

export default function AdvancedWordRotator({ 
  words, 
  interval = 3000, 
  className = '',
  textClassName = '',
  animationDuration = 600
}: AdvancedWordRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'out' | 'in'>('idle');

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      const next = (currentIndex + 1) % words.length;
      setNextIndex(next);
      setIsAnimating(true);
      setAnimationPhase('out');

      // Fase 1: Palavra atual sai
      setTimeout(() => {
        setCurrentIndex(next);
        setAnimationPhase('in');
      }, animationDuration / 2);

      // Fase 2: Nova palavra entra
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationPhase('idle');
      }, animationDuration);
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, words.length, interval, animationDuration]);

  if (words.length === 0) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'out':
        return 'opacity-0 -translate-y-4 scale-95';
      case 'in':
        return 'opacity-100 translate-y-0 scale-100';
      default:
        return 'opacity-100 translate-y-0 scale-100';
    }
  };

  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <span 
        className={`inline-block transition-all duration-${animationDuration} ease-out transform ${getAnimationClasses()} ${textClassName}`}
        style={{
          transformOrigin: 'center bottom',
          willChange: 'transform, opacity'
        }}
      >
        {words[currentIndex]}
      </span>
    </div>
  );
} 