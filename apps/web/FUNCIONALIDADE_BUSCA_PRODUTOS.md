# Funcionalidade de Busca de Produtos e Serviços - Bancada

## Nova Funcionalidade Implementada

A página de editar OS da bancada agora possui funcionalidade completa de busca e seleção de produtos e serviços.

### Funcionalidades Adicionadas:

1. **Busca de Produtos**: Campo de busca com autocomplete para produtos
2. **Busca de Serviços**: Campo de busca com autocomplete para serviços
3. **Lista de Selecionados**: Visualização dos produtos e serviços escolhidos
4. **Controle de Quantidade**: Para produtos, permite ajustar a quantidade
5. **Cálculo Automático**: Soma automática dos valores
6. **Remoção**: Botão para remover itens da lista

### Como Usar:

1. **Acesse a página da bancada** (`/bancada`)
2. **Clique em "Visualizar"** em uma ordem de serviço
3. **Clique em "Iniciar OS"** para começar o trabalho
4. **Na página de edição**, você verá:
   - Campo de busca de produtos
   - Campo de busca de serviços
   - Lista dos itens selecionados
   - Totais calculados automaticamente

### Campos de Busca:

- **Produtos**: Digite o nome do produto (ex: "tela", "bateria")
- **Serviços**: Digite o nome do serviço (ex: "troca", "formatação")
- **Autocomplete**: Aparecem sugestões conforme você digita
- **Seleção**: Clique no item desejado para adicionar

### Controles:

- **Quantidade**: Para produtos, ajuste a quantidade no campo numérico
- **Remover**: Clique no X para remover um item
- **Totais**: Valores calculados automaticamente
- **Salvar**: Salva todos os dados na OS

### Dados Salvos:

- **Produtos**: Nome, quantidade e valor total
- **Serviços**: Nome e valor
- **Valores**: Atualizados automaticamente na OS
- **Status**: Atualizado conforme o progresso

### Scripts SQL Necessários:

Para que a funcionalidade funcione, execute estes scripts:

1. **Corrigir status EM ANÁLISE**:
```sql
-- Execute: corrigir_status_em_analise.sql
```

2. **Criar produtos e serviços de teste**:
```sql
-- Execute: criar_produtos_servicos_teste.sql
```

### Componentes Criados:

- `ProdutoServicoSearch.tsx`: Componente de busca com autocomplete
- Atualização da página `bancada/[id]/page.tsx`
- Funções de cálculo e gerenciamento de estado

### Benefícios:

- **Agilidade**: Busca rápida de produtos/serviços
- **Precisão**: Evita erros de digitação
- **Controle**: Quantidades e valores calculados automaticamente
- **Organização**: Lista clara dos itens utilizados
- **Integração**: Dados salvos diretamente na OS

### Próximos Passos:

1. Execute os scripts SQL
2. Teste a funcionalidade na bancada
3. Verifique se os produtos/serviços aparecem na busca
4. Teste a adição, remoção e cálculo de valores
5. Salve uma OS para verificar se os dados são persistidos

A funcionalidade está pronta para uso e deve melhorar significativamente a experiência do técnico ao trabalhar com as ordens de serviço. 