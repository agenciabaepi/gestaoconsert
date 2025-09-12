# Animações de Scroll Reveal - Documentação

## Visão Geral

Implementamos um sistema completo de animações de scroll reveal na landing page do Consert, criando uma experiência de navegação mais fluida e moderna. As animações são suaves, elegantes e não exageradas, seguindo as melhores práticas de UX.

## Características das Animações

- **Tipo**: Transição suave dos elementos ao rolar a página (efeito de scroll reveal)
- **Comportamento**: Elementos surgem com movimento vertical (de baixo para cima) e opacidade indo de 0 até 1
- **Duração**: 0.5 a 0.8 segundos com delays leves entre elementos (staggered effect)
- **Trigger**: Animação só acontece quando o elemento entra no campo de visão do usuário
- **Tecnologia**: IntersectionObserver com CSS transitions (leve e compatível)

## Como Usar

### 1. Hook useScrollReveal

```typescript
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function MeuComponente() {
  const { isAnimated } = useScrollReveal({
    threshold: 0.1,        // Quando 10% do elemento está visível
    rootMargin: '0px 0px -50px 0px', // Margem para trigger
    delay: 0,              // Delay inicial
    duration: 800,         // Duração da animação
    stagger: 100           // Delay entre elementos (ms)
  });

  return (
    <div 
      data-reveal="meu-elemento"
      className={`minha-classe scroll-reveal-slide-up ${
        isAnimated('meu-elemento') ? 'revealed' : ''
      }`}
    >
      Conteúdo animado
    </div>
  );
}
```

### 2. Classes CSS Disponíveis

#### Classes Base
- `scroll-reveal` - Animação básica (fade + slide up)
- `scroll-reveal-fade` - Apenas fade
- `scroll-reveal-slide-up` - Slide de baixo para cima
- `scroll-reveal-slide-left` - Slide da esquerda
- `scroll-reveal-slide-right` - Slide da direita
- `scroll-reveal-scale` - Scale + slide up

#### Classes Especiais
- `hero-reveal` - Para títulos principais (animação mais dramática)
- `card-reveal` - Para cards e elementos interativos
- `number-reveal` - Para números e métricas
- `chart-reveal` - Para gráficos e visualizações

#### Classes de Delay
- `scroll-reveal-delay-100` - 100ms de delay
- `scroll-reveal-delay-200` - 200ms de delay
- `scroll-reveal-delay-300` - 300ms de delay
- `scroll-reveal-delay-400` - 400ms de delay
- `scroll-reveal-delay-500` - 500ms de delay

### 3. Exemplos de Uso

#### Título Principal
```jsx
<h1 
  data-reveal="main-title"
  className={`text-6xl font-light hero-reveal ${
    isAnimated('main-title') ? 'revealed' : ''
  }`}
>
  Título Principal
</h1>
```

#### Subtítulo com Delay
```jsx
<p 
  data-reveal="subtitle"
  className={`text-xl scroll-reveal-slide-up scroll-reveal-delay-300 ${
    isAnimated('subtitle') ? 'revealed' : ''
  }`}
>
  Subtítulo com animação
</p>
```

#### Grid de Cards
```jsx
<div className="grid grid-cols-3 gap-8">
  <div 
    data-reveal="card-1"
    className={`card-reveal ${
      isAnimated('card-1') ? 'revealed' : ''
    }`}
  >
    Card 1
  </div>
  
  <div 
    data-reveal="card-2"
    className={`card-reveal scroll-reveal-delay-100 ${
      isAnimated('card-2') ? 'revealed' : ''
    }`}
  >
    Card 2
  </div>
  
  <div 
    data-reveal="card-3"
    className={`card-reveal scroll-reveal-delay-200 ${
      isAnimated('card-3') ? 'revealed' : ''
    }`}
  >
    Card 3
  </div>
</div>
```

#### Números/Métricas
```jsx
<div 
  data-reveal="metric"
  className={`number-reveal ${
    isAnimated('metric') ? 'revealed' : ''
  }`}
>
  <div className="text-4xl font-bold">127%</div>
  <div className="text-sm">Crescimento</div>
</div>
```

## Implementação na Landing Page

### Seções Animadas

1. **Hero Section**
   - Badge de social proof
   - Título principal
   - Subtítulo
   - Botões CTA

2. **Seção de Demonstração**
   - Imagem do MacBook
   - Call to action

3. **Seção de Recursos**
   - Título da seção
   - Grid de 6 cards de features

4. **Seção de Analytics**
   - Título e subtítulo
   - Container de gráficos
   - Métricas animadas

5. **Seção de Preços**
   - Título da seção
   - 3 cards de planos
   - Informações adicionais

## Performance e Acessibilidade

### Performance
- Usa IntersectionObserver (nativo e eficiente)
- CSS transitions otimizadas
- `will-change` para melhor performance
- Lazy loading das animações

### Acessibilidade
- Respeita `prefers-reduced-motion`
- Animações desabilitadas para usuários que preferem menos movimento
- Mantém funcionalidade mesmo sem animações

### Responsividade
- Animações funcionam em todos os dispositivos
- Performance otimizada para mobile
- Breakpoints considerados no design

## Customização

### Modificar Duração
```css
.scroll-reveal {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); /* Mais rápido */
}
```

### Modificar Easing
```css
.scroll-reveal {
  transition: all 0.8s ease-out; /* Easing diferente */
}
```

### Adicionar Novas Classes
```css
.scroll-reveal-bounce {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.scroll-reveal-bounce.revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

## Troubleshooting

### Elemento não anima
1. Verifique se o `data-reveal` está correto
2. Confirme se o hook `useScrollReveal` está sendo usado
3. Verifique se a classe CSS está aplicada

### Animação muito rápida/lenta
1. Ajuste a `duration` no hook
2. Modifique as classes CSS de delay
3. Ajuste o `stagger` para efeito em cadeia

### Performance ruim
1. Reduza o número de elementos animados
2. Use `will-change` apenas quando necessário
3. Considere usar `transform` em vez de `opacity` quando possível

## Próximos Passos

1. **Extensão para outras páginas**: Aplicar o sistema em outras páginas do sistema
2. **Animações mais complexas**: Adicionar animações para interações específicas
3. **Configuração via props**: Permitir configuração via props do componente
4. **Animações de saída**: Implementar animações quando elementos saem da tela

## Conclusão

O sistema de animações de scroll reveal implementado oferece uma experiência de usuário moderna e elegante, mantendo a performance e acessibilidade. As animações são sutis e profissionais, adequadas para um sistema de gestão empresarial como o Consert. 