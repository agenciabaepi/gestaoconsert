'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function ScrollRevealExample() {
  const { isAnimated } = useScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    delay: 0,
    duration: 800,
    stagger: 100
  });

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Hero Section com animações */}
      <section className="py-20">
        <div 
          data-reveal="hero-title"
          className={`text-6xl font-light text-white mb-8 hero-reveal ${
            isAnimated('hero-title') ? 'revealed' : ''
          }`}
        >
          Título Principal
        </div>
        
        <div 
          data-reveal="hero-subtitle"
          className={`text-xl text-white/70 mb-12 scroll-reveal-slide-up scroll-reveal-delay-300 ${
            isAnimated('hero-subtitle') ? 'revealed' : ''
          }`}
        >
          Subtítulo com animação suave
        </div>
        
        <div 
          data-reveal="hero-cta"
          className={`scroll-reveal-slide-up scroll-reveal-delay-500 ${
            isAnimated('hero-cta') ? 'revealed' : ''
          }`}
        >
          <button className="px-8 py-4 bg-[#D1FE6E] text-black rounded-full font-medium">
            Botão CTA
          </button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-20">
        <div 
          data-reveal="cards-title"
          className={`text-4xl font-light text-white mb-16 hero-reveal ${
            isAnimated('cards-title') ? 'revealed' : ''
          }`}
        >
          Seção de Cards
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div 
            data-reveal="card-1"
            className={`card-reveal ${
              isAnimated('card-1') ? 'revealed' : ''
            }`}
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h3 className="text-white text-xl mb-4">Card 1</h3>
              <p className="text-white/70">Conteúdo do card com animação.</p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div 
            data-reveal="card-2"
            className={`card-reveal scroll-reveal-delay-100 ${
              isAnimated('card-2') ? 'revealed' : ''
            }`}
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h3 className="text-white text-xl mb-4">Card 2</h3>
              <p className="text-white/70">Conteúdo do card com animação.</p>
            </div>
          </div>
          
          {/* Card 3 */}
          <div 
            data-reveal="card-3"
            className={`card-reveal scroll-reveal-delay-200 ${
              isAnimated('card-3') ? 'revealed' : ''
            }`}
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h3 className="text-white text-xl mb-4">Card 3</h3>
              <p className="text-white/70">Conteúdo do card com animação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Números Section */}
      <section className="py-20">
        <div 
          data-reveal="numbers-title"
          className={`text-4xl font-light text-white mb-16 hero-reveal ${
            isAnimated('numbers-title') ? 'revealed' : ''
          }`}
        >
          Seção de Números
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div 
            data-reveal="number-1"
            className={`number-reveal ${
              isAnimated('number-1') ? 'revealed' : ''
            }`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D1FE6E] mb-2">127%</div>
              <div className="text-white/70">Crescimento</div>
            </div>
          </div>
          
          <div 
            data-reveal="number-2"
            className={`number-reveal scroll-reveal-delay-100 ${
              isAnimated('number-2') ? 'revealed' : ''
            }`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D1FE6E] mb-2">45%</div>
              <div className="text-white/70">Redução</div>
            </div>
          </div>
          
          <div 
            data-reveal="number-3"
            className={`number-reveal scroll-reveal-delay-200 ${
              isAnimated('number-3') ? 'revealed' : ''
            }`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D1FE6E] mb-2">89%</div>
              <div className="text-white/70">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos Section */}
      <section className="py-20">
        <div 
          data-reveal="charts-title"
          className={`text-4xl font-light text-white mb-16 hero-reveal ${
            isAnimated('charts-title') ? 'revealed' : ''
          }`}
        >
          Seção de Gráficos
        </div>
        
        <div 
          data-reveal="chart-container"
          className={`chart-reveal ${
            isAnimated('chart-container') ? 'revealed' : ''
          }`}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <h3 className="text-white text-xl mb-4">Gráfico de Exemplo</h3>
            <div className="h-64 bg-gradient-to-r from-[#D1FE6E]/20 to-[#B8E55A]/20 rounded-lg flex items-center justify-center">
              <span className="text-white/50">Área do gráfico</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 