'use client';

import { useState, useEffect } from 'react';

interface UltraModernWordRotatorProps {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}

export default function UltraModernWordRotator({ 
  words, 
  interval = 3000, 
  className = '',
  textClassName = ''
}: UltraModernWordRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 600);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <span className={`relative inline-block leading-none ${className}`} style={{ lineHeight: '1.4', paddingBottom: '8px' }}>
      <span 
        className={`inline-block transition-all duration-800 ease-out ${
          isAnimating 
            ? 'opacity-0 -translate-y-6 scale-90' 
            : 'opacity-100 translate-y-0 scale-100'
        } ${textClassName}`}
        style={{
          transformOrigin: 'center',
          willChange: 'transform, opacity',
          background: 'linear-gradient(135deg, #D1FE6E 0%, #B8E55A 25%, #A5D44A 50%, #8BC34A 75%, #4CAF50 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundSize: '300% 300%',
          animation: isAnimating ? 'mobileGradientShift 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'mobileGradientIdle 3s ease-in-out infinite',
          textShadow: isAnimating ? '0 0 15px rgba(209, 254, 110, 0.4)' : '0 0 8px rgba(209, 254, 110, 0.3)',
          display: 'inline-block',
          lineHeight: '1.4',
          paddingBottom: '8px',
          paddingTop: '2px',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        {words[currentIndex]}
      </span>

      <style jsx>{`
        @keyframes mobileGradientShift {
          0% {
            background-position: 0% 50%;
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          20% {
            opacity: 0.8;
            transform: translateY(-3px) scale(0.95);
          }
          50% {
            opacity: 0;
            transform: translateY(-24px) scale(0.9);
          }
          100% {
            background-position: 100% 50%;
            opacity: 0;
            transform: translateY(-24px) scale(0.9);
          }
        }

        @keyframes mobileGradientIdle {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  );
} 