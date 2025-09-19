import { useEffect, useState } from 'react';

export const useScrollReveal = () => {
  const [animatedElements, setAnimatedElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('[data-reveal]');
      
      elements.forEach((element) => {
        const elementId = element.getAttribute('data-reveal');
        if (!elementId || animatedElements.has(elementId)) return;

        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;

        if (isVisible) {
          console.log('Animating element:', elementId);
          setAnimatedElements(prev => new Set([...prev, elementId]));
          
          // Adicionar classe animated ao elemento
          element.classList.add('animated');
        }
      });
    };

    // Verificar elementos visíveis inicialmente após um pequeno delay
    setTimeout(handleScroll, 100);

    // Adicionar listener de scroll
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [animatedElements]);

  return {
    isAnimated: (elementId: string) => animatedElements.has(elementId)
  };
}; 