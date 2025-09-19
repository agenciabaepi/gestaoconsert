import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const useScrollReveal = () => {
  const [animatedElements, setAnimatedElements] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    
    if (!isLandingPage) {
      // Para páginas internas: marcar todos como animados instantaneamente
      const allIds = Array.from(elements).map(el => el.getAttribute('data-reveal')).filter(Boolean) as string[];
      
      if (allIds.length > 0) {
        setAnimatedElements(new Set(allIds));
        
        // Adicionar classe 'animated' instantaneamente
        elements.forEach(element => {
          element.classList.add('animated');
        });
      }
      return;
    }

    // Para landing page: aplicar animações normais
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const revealId = entry.target.getAttribute('data-reveal');
          if (revealId && entry.isIntersecting) {
            setAnimatedElements(prev => new Set([...prev, revealId]));
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    elements.forEach(element => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLandingPage]);

  return {
    isAnimated: (id: string) => animatedElements.has(id)
  };
};