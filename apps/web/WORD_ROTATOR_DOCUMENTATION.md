# Word Rotator - Documentação

## Visão Geral

Implementamos três tipos de rotadores de palavras com efeitos suaves e elegantes, como uma roleta 3D. Os componentes são leves, fáceis de manter e oferecem diferentes níveis de sofisticação visual.

## Componentes Disponíveis

### 1. WordRotator (Simples)
Componente básico com transição suave de fade-out/fade-in.

### 2. AdvancedWordRotator (Avançado)
Versão com efeitos mais elaborados, incluindo scale e transformações mais complexas.

### 3. WordRotator3D (3D/Roleta)
Versão com efeito 3D realista, simulando uma roleta com rotação e perspectiva.

## Como Usar

### Importação
```typescript
import WordRotator from '@/components/WordRotator';
import AdvancedWordRotator from '@/components/AdvancedWordRotator';
import WordRotator3D from '@/components/WordRotator3D';
```

### Uso Básico
```jsx
<WordRotator 
  words={['Profissional', 'Criativo', 'Inovador']}
  interval={3000}
  textClassName="text-[#D1FE6E] font-medium"
/>
```

### Props Disponíveis

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `words` | `string[]` | `[]` | Lista de palavras/frases para rotacionar |
| `interval` | `number` | `3000` | Intervalo entre trocas (em ms) |
| `className` | `string` | `''` | Classes CSS para o container |
| `textClassName` | `string` | `''` | Classes CSS para o texto |

### Exemplos de Uso

#### 1. Rotador Simples
```jsx
<div className="text-4xl text-white">
  <span>Sou </span>
  <WordRotator 
    words={['Profissional', 'Criativo', 'Inovador']}
    interval={2000}
    textClassName="text-[#D1FE6E] font-medium"
  />
</div>
```

#### 2. Rotador Avançado
```jsx
<div className="text-3xl text-white">
  <span>Oferecemos </span>
  <AdvancedWordRotator 
    words={['Sistema completo', 'Gestão inteligente', 'Resultados reais']}
    interval={2500}
    textClassName="text-[#D1FE6E] font-medium"
  />
</div>
```

#### 3. Rotador 3D
```jsx
<div className="text-2xl text-white">
  <span>Transformamos em algo </span>
  <WordRotator3D 
    words={['incrível', 'extraordinário', 'excepcional']}
    interval={3000}
    textClassName="text-[#D1FE6E] font-medium"
  />
</div>
```

#### 4. Múltiplos Rotadores
```jsx
<div className="text-xl text-white space-y-2">
  <div>
    <span>Sistema </span>
    <WordRotator words={['moderno', 'intuitivo', 'poderoso']} />
  </div>
  <div>
    <span>para </span>
    <AdvancedWordRotator words={['gestão', 'controle', 'organização']} />
  </div>
  <div>
    <span>de </span>
    <WordRotator3D words={['assistências', 'oficinas', 'negócios']} />
  </div>
</div>
```

## Características dos Efeitos

### WordRotator (Simples)
- **Efeito**: Fade-out/fade-in com movimento vertical
- **Duração**: 600ms
- **Easing**: ease-in-out
- **Movimento**: -translate-y-2 (para cima)

### AdvancedWordRotator (Avançado)
- **Efeito**: Fade + scale + movimento vertical
- **Duração**: 600ms (configurável)
- **Easing**: ease-out
- **Movimento**: -translate-y-4 + scale-95
- **Transform Origin**: center bottom

### WordRotator3D (3D)
- **Efeito**: Rotação 3D + scale + movimento
- **Duração**: 800ms
- **Easing**: ease-out
- **Movimento**: -translate-y-6 + rotate-x-12 + scale-95
- **Efeito 3D**: Simula rotação em eixo X

## Personalização

### CSS Customizado
```css
/* Personalizar animação */
.word-rotator-custom {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.word-rotator-custom.animated {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### Classes de Delay
```jsx
<WordRotator 
  words={words}
  textClassName="delay-300" // Delay de 300ms
/>
```

### Intervalos Diferentes
```jsx
// Rápido
<WordRotator interval={1500} />

// Médio
<WordRotator interval={3000} />

// Lento
<WordRotator interval={5000} />
```

## Implementação na Landing Page

### Título Principal
```jsx
<h1 className="text-6xl font-light">
  Sua assistência com 
  <WordRotator 
    words={['gestão inteligente', 'sistema completo', 'resultados reais']}
    interval={3000}
    textClassName="text-gradient-secondary"
  />
</h1>
```

### Subtítulo
```jsx
<p className="text-xl text-white/80">
  Consert transforma oficinas em 
  <WordRotator 
    words={['máquinas de crescimento', 'sistemas inteligentes', 'negócios lucrativos']}
    interval={4000}
    textClassName="text-[#D1FE6E] font-medium"
  />
  —onde cada ordem de serviço...
</p>
```

## Performance e Otimização

### Boas Práticas
1. **Limite o número de palavras**: 3-5 palavras por rotador
2. **Use intervalos adequados**: 2-4 segundos para boa legibilidade
3. **Evite frases muito longas**: Pode quebrar o layout
4. **Teste em diferentes dispositivos**: Performance pode variar

### Otimizações Implementadas
- `willChange: 'transform, opacity'` para melhor performance
- `backfaceVisibility: 'hidden'` para evitar glitches
- Cleanup automático de timers
- Verificação de palavras vazias

## Troubleshooting

### Problema: Animação não funciona
**Solução**: Verifique se há pelo menos 2 palavras no array

### Problema: Texto pisca
**Solução**: Aumente o intervalo ou ajuste a duração da animação

### Problema: Layout quebra
**Solução**: Use `overflow-hidden` no container ou limite o tamanho do texto

### Problema: Performance ruim
**Solução**: Reduza o número de rotadores na página ou aumente os intervalos

## Exemplos de Uso Avançado

### Rotador com Frases Longas
```jsx
<WordRotator 
  words={[
    'que sua assistência precisa para crescer',
    'que transforma desafios em oportunidades',
    'que conecta eficiência com resultados'
  ]}
  interval={4000}
  textClassName="text-[#D1FE6E] font-medium"
/>
```

### Rotador com Diferentes Estilos
```jsx
<div className="space-y-4">
  <WordRotator 
    words={['Simples']}
    textClassName="text-blue-500"
  />
  <AdvancedWordRotator 
    words={['Avançado']}
    textClassName="text-green-500"
  />
  <WordRotator3D 
    words={['3D']}
    textClassName="text-purple-500"
  />
</div>
```

## Páginas de Teste

- `/teste-rotador` - Demonstração completa dos rotadores
- `/teste-animacao` - Teste das animações de scroll reveal

## Conclusão

Os rotadores de palavras oferecem uma maneira elegante e dinâmica de apresentar informações variáveis. São leves, customizáveis e se integram perfeitamente com o design system do Consert. 