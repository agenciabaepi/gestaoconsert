'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState, useEffect } from 'react';

export default function AnimationTest() {
  const { isAnimated } = useScrollReveal();
  const [forceAnimate, setForceAnimate] = useState(false);

  useEffect(() => {
    // Forçar animação após 2 segundos para teste
    const timer = setTimeout(() => {
      setForceAnimate(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-20">
        {/* Teste 1 */}
        <div 
          data-reveal="test1"
          className={`text-4xl text-white text-center scroll-reveal-slide-up ${
            (isAnimated('test1') || forceAnimate) ? 'animated' : ''
          }`}
        >
          Teste de Animação 1
        </div>

        {/* Teste 2 */}
        <div 
          data-reveal="test2"
          className={`text-4xl text-white text-center scroll-reveal-slide-up delay-300 ${
            (isAnimated('test2') || forceAnimate) ? 'animated' : ''
          }`}
        >
          Teste de Animação 2
        </div>

        {/* Teste 3 */}
        <div 
          data-reveal="test3"
          className={`text-4xl text-white text-center scroll-reveal-scale delay-600 ${
            (isAnimated('test3') || forceAnimate) ? 'animated' : ''
          }`}
        >
          Teste de Animação 3
        </div>

        {/* Teste 4 */}
        <div 
          data-reveal="test4"
          className={`text-4xl text-white text-center scroll-reveal-fade delay-900 ${
            (isAnimated('test4') || forceAnimate) ? 'animated' : ''
          }`}
        >
          Teste de Animação 4
        </div>

        {/* Teste 5 */}
        <div 
          data-reveal="test5"
          className={`text-4xl text-white text-center scroll-reveal delay-1200 ${
            (isAnimated('test5') || forceAnimate) ? 'animated' : ''
          }`}
        >
          Teste de Animação 5
        </div>

        {/* Botão para testar manualmente */}
        <div className="text-center">
          <button 
            onClick={() => setForceAnimate(!forceAnimate)}
            className="px-4 py-2 bg-[#D1FE6E] text-black rounded"
          >
            {forceAnimate ? 'Reset Animations' : 'Force Animate'}
          </button>
        </div>
      </div>
    </div>
  );
} 