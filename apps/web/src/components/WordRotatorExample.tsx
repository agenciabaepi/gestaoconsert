'use client';

import WordRotator from './WordRotator';
import AdvancedWordRotator from './AdvancedWordRotator';
import WordRotator3D from './WordRotator3D';

export default function WordRotatorExample() {
  const words = [
    'Profissional',
    'Criativo', 
    'Inovador',
    'Eficiente',
    'Inteligente'
  ];

  const phrases = [
    'Sistema completo',
    'Gestão inteligente',
    'Resultados reais',
    'Crescimento contínuo',
    'Sucesso garantido'
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Exemplo 1: Rotador Simples */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-8">Rotador Simples</h2>
          <div className="text-6xl font-light text-white">
            <span className="text-white/70">Sou </span>
            <WordRotator 
              words={words}
              interval={2000}
              textClassName="text-[#D1FE6E] font-medium"
            />
          </div>
        </div>

        {/* Exemplo 2: Rotador Avançado */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-8">Rotador Avançado</h2>
          <div className="text-5xl font-light text-white">
            <span className="text-white/70">Oferecemos </span>
            <AdvancedWordRotator 
              words={phrases}
              interval={2500}
              textClassName="text-[#D1FE6E] font-medium"
            />
          </div>
        </div>

        {/* Exemplo 3: Rotador 3D */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-8">Rotador 3D (Roleta)</h2>
          <div className="text-4xl font-light text-white">
            <span className="text-white/70">Transformamos sua assistência em algo </span>
            <WordRotator3D 
              words={['incrível', 'extraordinário', 'excepcional', 'fantástico']}
              interval={3000}
              textClassName="text-[#D1FE6E] font-medium"
            />
          </div>
        </div>

        {/* Exemplo 4: Múltiplos Rotadores */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-8">Múltiplos Rotadores</h2>
          <div className="text-3xl font-light text-white space-y-4">
            <div>
              <span className="text-white/70">Sistema </span>
              <WordRotator 
                words={['moderno', 'intuitivo', 'poderoso']}
                interval={1500}
                textClassName="text-[#D1FE6E] font-medium"
              />
            </div>
            <div>
              <span className="text-white/70">para </span>
              <AdvancedWordRotator 
                words={['gestão', 'controle', 'organização']}
                interval={2000}
                textClassName="text-[#D1FE6E] font-medium"
              />
            </div>
            <div>
              <span className="text-white/70">de </span>
              <WordRotator3D 
                words={['assistências', 'oficinas', 'negócios']}
                interval={2500}
                textClassName="text-[#D1FE6E] font-medium"
              />
            </div>
          </div>
        </div>

        {/* Exemplo 5: Rotador com Frases Longas */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-8">Frases Longas</h2>
          <div className="text-2xl font-light text-white max-w-3xl mx-auto">
            <span className="text-white/70">Consert é a solução </span>
            <WordRotator 
              words={[
                'que sua assistência precisa para crescer',
                'que transforma desafios em oportunidades',
                'que conecta eficiência com resultados',
                'que impulsiona seu negócio para o futuro'
              ]}
              interval={4000}
              textClassName="text-[#D1FE6E] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 