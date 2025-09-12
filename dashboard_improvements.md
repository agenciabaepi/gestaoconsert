# Melhorias Visuais para o Sistema Kanban

## 1. Melhorias nos Cards de Notas

### Substitua o card atual por este design mais moderno:

```tsx
<div className=group relative bg-white rounded-xl border border-gray-100ow-sm hover:shadow-lg transition-all duration-20flow-hidden cursor-pointer>  {/* Indicador de cor lateral */}
  <div className={`absolute left-0 top0bottom-0 w-1 ${nota.cor}`} />
  
  <div className="flex-1 p-4
    {/* Header do card */}
    <div className="flex items-start justify-between mb-3">
      <h3 className={clsx(
    font-semibold text-gray-90 text-sm leading-tight",
        nota.concluida && line-through text-gray-500"
      )}>
    [object Object]nota.titulo}
      </h3>
      
   [object Object]/* Botão de editar com hover */}
      <div className=flex items-center gap-1 opacity-0 group-hover:opacity-100transition-opacity>
        <button
          className=p-1 text-gray-400over:text-gray-600 hover:bg-gray-100 rounded transition-colors      type=button"
          onMouseDown={() => [object Object]           setNovaNota({
              titulo: nota.titulo,
              texto: nota.texto,
              cor: nota.cor,
              coluna: nota.coluna,
              prioridade: nota.prioridade || 'Média',
            });
            setNotaEditando(nota);
            setShowModal(true);
          }}
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>

    {/* Conteúdo */}
    <p className={clsx(
      text-xs text-gray-600 mb-3ne-clamp-2,
      nota.concluida && line-through"
    )}>
    [object Object]nota.texto}
    </p>

    {/* Prioridade com design melhorado */}
    <div className=flex items-center gap-2 mb-3">
      <span className={clsx(
   text-xs font-medium px-2 py-1 rounded-full border",
        nota.prioridade?.toLowerCase() === alta'
          ?bg-red-50order-red-200red-700          : nota.prioridade?.toLowerCase() ===média'
          ? 'bg-yellow-50 border-yellow-20 text-yellow-700       : 'bg-green-50der-green-200t-green-700'
      )}>
        {nota.prioridade}
      </span>
    </div>

    {/* Footer com ícones */}
    <div className=flex items-center justify-between">
      <div className=flex items-center gap-2 text-xs text-gray-500">
        <Calendar size={12} />
        <span>{formatarData(nota.data_criacao)}</span>
      </div>
      
      {/* Botão de concluir com ícones */}
      <button
        onClick={() => toggleNotaConcluida(nota)}
        className={clsx(
          flex items-center gap-1 text-xs transition-colors",
          nota.concluida 
            ?text-green-600           : "text-gray-400 hover:text-green-600       )}
      >
        {nota.concluida ? (
          <>
            <CheckCircle size={12} />
            <span>Concluída</span>
          </>
        ) : (
          <>
            <Circle size={12} />
            <span>Marcar como concluída</span>
          </>
        )}
      </button>
    </div>
  </div>
</div>
```

## 2. Melhorias no Header das Colunas

### Substitua o header da coluna por este design:

```tsx
<div className="bg-gradient-to-r from-blue-50 to-blue-10rder-b border-gray-10px-4 py-3">
  <div className=flex items-center justify-between">
    <div className=flex items-center gap-2">
      <GripVertical size={16assName="text-gray-500     <h3 className="font-semibold text-gray-800 text-sm capitalize>
        [object Object]coluna}
      </h3>
      <span className="bg-white/50 text-gray-600 text-xs px-2 py-1ded-full">
        {notas.filter(n => n.coluna === coluna).length}
      </span>
    </div>
    
    <div className=flex items-center gap-1   <button
        className=p-1 text-gray-40hover:text-red-50:bg-red-50 rounded transition-colors"
        title="Excluir coluna"
        onMouseDown={async () =>[object Object]     const confirmacao = window.confirm(`Tem certeza que deseja excluir a coluna "${coluna}?`);
          if (confirmacao) {
            const novas = colunas.filter((_, i) => i !== index);
            setColunas(novas);
            await removerColuna(coluna);
            salvarColunasNoBanco(novas);
            setNotes((prev) => prev.filter((n) => n.coluna !== coluna));
          }
        }}
      >
        <Trash size={14} />
      </button>
    </div>
  </div>
</div>
```

## 3. Melhorias no Botão de Adicionar Nota

### Substitua o botão de adicionar nota por este design:

```tsx
<div className="px-3 py-2rder-t border-gray-10  <button
    type="button className=w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600over:text-gray-800 rounded-lg transition-all duration-200group"
    onMouseDown=[object Object]() => [object Object]
      setNovaNota({ titulo: , texto: ', cor: 'bg-yellow-50coluna, prioridade:Média });
      setNotaEditando(null);
      setShowModal(true);
    }}
  >
    <Plus size={16} className=group-hover:scale-110 transition-transform" />
    <span>Adicionar nota</span>
  </button>
</div>
```

## 4. Melhorias no Botão de Nova Coluna

### Substitua o botão de nova coluna por este design:

```tsx
<div className=min-w-[280] max-w-[320x]">
  <button
    onClick={async () => [object Object]      const nova = prompt('Nome da nova coluna);
      if (nova && !colunas.includes(nova)) {
        const novas = [...colunas, nova.toLowerCase()];
        setColunas(novas);
        await criarColuna(nova.toLowerCase());
        salvarColunasNoBanco(novas);
      }
    }}
    className=w-full h-full min-h-[200px] border-2 border-dashed rounded-2ition-all duration-200lex flex-col items-center justify-center gap-3border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100  >
    <Plus size={24assName="text-gray-400   <span className="text-sm font-medium text-gray-600
      Nova coluna
    </span>
  </button>
</div>
```

## 5. Melhorias no Modal de Edição

### Substitua o modal por este design mais moderno:

```tsx
<div className="fixed inset0 flex items-center justify-center bg-black/50backdrop-blur-sm p-4">
  <div className=bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4rder-b border-gray-100">
      <div className=flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900>        [object Object]notaEditando ?Editar Anotação :NovaAnotação'}
        </h2>
        <button
          onClick={onClose}
          className=p-1 text-gray-400over:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>

  [object Object]/* Content */}
    <div className=px-6 py-4 space-y-4">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700mb-2">
          Título
        </label>
        <input
          type="text"
          placeholder="Digite o título da nota"
          value={novaNota.titulo}
          onChange=[object Object](e) => setNovaNota({ ...novaNota, titulo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2ocus:ring-blue-500 focus:border-transparent transition-colors       />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-7002         Descrição
        </label>
        <textarea
          placeholder="Digite a descrição da nota"
          value={novaNota.texto}
          onChange=[object Object](e) => setNovaNota({ ...novaNota, texto: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2ocus:ring-blue-500 focus:border-transparent transition-colors resize-none       />
      </div>

  [object Object]/* Cores */}
      <div>
        <label className="block text-sm font-medium text-gray-700-2       Cor
        </label>
        <div className="flex gap-2    {[
          [object Object] cor: 'bg-blue-500, name: 'Azul },
           [object Object]cor: 'bg-green-50 name: 'Verde },
            { cor: 'bg-yellow-500, name: 'Amarelo },
            { cor: 'bg-purple-500, name: 'Roxo },
            { cor: 'bg-orange-500, name: 'Laranja },
          [object Object] cor: 'bg-pink-500, name:Rosa' }
          ].map((opcao) => (
            <button
              key={opcao.cor}
              onClick={() => setNovaNota([object Object] ...novaNota, cor: opcao.cor })}
              className={clsx(
              w-8ed-full transition-all duration-200,                opcao.cor,
                novaNota.cor === opcao.cor 
                  ? "ring-2 ring-offset-2 ring-blue-500 scale-110" 
                  : hover:scale-105
              )}
              title={opcao.name}
            />
          ))}
        </div>
      </div>

  [object Object]/* Prioridade */}
      <div>
        <label className="block text-sm font-medium text-gray-700>        Prioridade
        </label>
        <div className="flex gap-2>         [object Object]['Baixa',Média', Alta].map((prioridade) => (
            <button
              key={prioridade}
              type="button"
              onClick={() => setNovaNota({ ...novaNota, prioridade })}
              className={clsx(
                px-3 rounded-lg border text-sm font-medium transition-all duration-200,              novaNota.prioridade === prioridade
                  ? (
                    prioridade === 'Alta'
                      ? 'bg-red-50 text-red-700                   : prioridade === 'Média'
                        ? bg-yellow-50-yellow-700 border-yellow-200'
                        :bg-green-50t-green-700border-green-200'
                  )
                  : 'bg-gray-50 text-gray-60der-gray-200 hover:bg-gray-100
              )}
            >
              {prioridade}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="px-6 py-4rder-t border-gray-10gray-50 flex items-center justify-between">
      <div className="flex gap-2
      [object Object]notaEditando && (
          <button
            onClick={() => [object Object]           onClose();
              setNotaSelecionada(notaEditando);
              setTimeout(() =>[object Object]               setExibirExcluirNotaModal(true);
              },200);
            }}
            className=px-4 py-2 text-sm text-red-60hover:text-red-70:bg-red-50 rounded-lg transition-colors"
          >
            Excluir
          </button>
        )}
      </div>
      
      <div className="flex gap-2>
        <button
          onClick={onClose}
          className=px-4 py-2 text-sm text-gray-600over:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={salvarOuAtualizarNota}
          disabled={!novaNota.titulo.trim()}
          className={clsx(
            px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            !novaNota.titulo.trim()
              ?bg-gray-300xt-gray-500cursor-not-allowed"
              :bg-blue-600 text-white hover:bg-blue-700        )}
        >
         [object Object]notaEditando ? Atualizar" : "Criar"}
        </button>
      </div>
    </div>
  </div>
</div>
```

## 6. Melhorias Gerais de Layout

### Adicione estas classes CSS para melhorar o layout geral:

```tsx
// Container principal do Kanban
<div className="flex gap-6overflow-x-auto pb-6

// Container das colunas
<div className="flex gap-6">

// Coluna individual
<div className=min-w-[280] max-w-[320px] bg-white rounded-2border border-gray-200 shadow-sm overflow-hidden">
```

## 7. Animações Suaves

### Para animações mais suaves, use estas transições:

```tsx
// Transições suaves para elementos
className="transition-all duration-200"

// Hover effects
className="hover:shadow-lg hover:scale-105ition-all duration-200

// Focus states
className="focus:ring-2ocus:ring-blue-500 focus:border-transparent"
```

## Instruções de Implementação

1. **Substitua gradualmente**: Faça uma mudança por vez para testar
2. **Mantenha a funcionalidade**: Não altere os event handlers ou lógica
3. **Teste cada mudança**: Verifique se o drag and drop continua funcionando
4. **Ajuste conforme necessário**: Personalize cores e espaçamentos conforme sua preferência

Estas melhorias visuais manterão toda a funcionalidade existente enquanto tornam o sistema mais moderno e elegante. 