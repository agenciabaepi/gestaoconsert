# 📋 Scripts de Limpeza de Dados

Este diretório contém scripts SQL para limpar dados de usuários e dados relacionados no sistema, **mantendo as tabelas intactas**.

## ⚠️ ATENÇÃO IMPORTANTE

- **SEMPRE** faça backup antes de executar qualquer script de limpeza
- Execute primeiro o script de **verificação** para ver o estado atual dos dados
- Teste em ambiente de desenvolvimento antes de usar em produção
- Os scripts **NÃO** apagam as tabelas, apenas os dados dentro delas

## 📁 Arquivos Disponíveis

### 1. `verificar_dados.sql`
- **Função**: Verificar o estado atual dos dados no banco
- **Uso**: Execute **ANTES** de qualquer limpeza para ver quantos registros existem
- **Seguro**: Apenas consultas SELECT, não modifica dados

### 2. `limpar_dados_usuarios.sql`
- **Função**: Limpar **TODOS** os dados de usuários e relacionados
- **Uso**: Para limpeza completa do sistema
- **Cuidado**: Exclui TODOS os dados de TODOS os usuários

### 3. `limpar_dados_seletivo.sql`
- **Função**: Limpar dados de forma seletiva (usuário específico, empresa específica, ou tudo)
- **Uso**: Para limpeza controlada e segura
- **Recomendado**: Use este script para maior controle

## 🚀 Como Usar

### Passo 1: Verificar Dados Atuais
```sql
-- Execute no Supabase SQL Editor ou seu cliente SQL
-- Copie e cole o conteúdo de verificar_dados.sql
```

### Passo 2: Escolher Tipo de Limpeza

#### Opção A: Limpeza Completa (Cuidado!)
```sql
-- Execute o script limpar_dados_usuarios.sql
-- ⚠️ Isso excluirá TODOS os dados
```

#### Opção B: Limpeza Seletiva (Recomendado)
```sql
-- 1. Abra limpar_dados_seletivo.sql
-- 2. Descomente apenas a seção desejada
-- 3. Substitua os valores de exemplo pelos reais
-- 4. Execute no Supabase SQL Editor
```

### Passo 3: Verificar Resultado
```sql
-- Execute novamente verificar_dados.sql
-- Confirme que os dados foram limpos corretamente
```

## 📊 Tabelas Afetadas

Os scripts podem limpar dados das seguintes tabelas:

### Tabelas Principais
- `empresas` - Empresas cadastradas
- `usuarios` - Usuários do sistema
- `clientes` - Clientes das empresas
- `fornecedores` - Fornecedores das empresas

### Tabelas de Produtos
- `produtos_servicos` - Produtos e serviços
- `grupos_produtos` - Grupos de categorização
- `categorias_produtos` - Categorias
- `subcategorias_produtos` - Subcategorias

### Tabelas Financeiras
- `turnos_caixa` - Turnos de caixa
- `movimentacoes_caixa` - Movimentações financeiras
- `vendas` - Vendas realizadas
- `itens_venda` - Itens das vendas

### Tabelas de Serviços
- `ordens_servico` - Ordens de serviço
- `lembretes` - Lembretes dos usuários

### Tabelas de Assinatura
- `assinaturas` - Assinaturas das empresas
- `cobrancas` - Cobranças das assinaturas

### Tabelas Preservadas
- `planos` - **NÃO** é limpa (dados do sistema)

## 🔧 Exemplos de Uso

### Limpar Usuário Específico
```sql
-- Substitua pelo email real
DELETE FROM usuarios WHERE email = 'usuario@exemplo.com';
```

### Limpar Empresa Específica
```sql
-- Substitua pelo nome real da empresa
DELETE FROM empresas WHERE nome = 'Nome da Empresa';
```

### Verificar Dados Antes da Limpeza
```sql
-- Ver quantos registros existem
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM empresas;
```

## 🛡️ Segurança

### Backup Recomendado
```sql
-- Antes de limpar, exporte os dados importantes
SELECT * FROM usuarios;
SELECT * FROM empresas;
SELECT * FROM clientes;
```

### Teste em Desenvolvimento
- Sempre teste os scripts em ambiente de desenvolvimento primeiro
- Verifique se as tabelas não foram afetadas
- Confirme que apenas os dados foram removidos

## ❓ Dúvidas Comuns

### Q: Os scripts apagam as tabelas?
**A**: Não! Os scripts apenas excluem os dados (DELETE), mantendo a estrutura das tabelas intacta.

### Q: Posso recuperar os dados depois?
**A**: Não automaticamente. Sempre faça backup antes de executar os scripts.

### Q: Os planos são afetados?
**A**: Não! A tabela `planos` é preservada pois contém dados do sistema.

### Q: Como limpar apenas um usuário específico?
**A**: Use o script `limpar_dados_seletivo.sql` e descomente apenas a seção de usuário específico.

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique se fez backup antes
2. Confirme que está no ambiente correto
3. Execute o script de verificação para diagnosticar
4. Consulte a documentação do Supabase se necessário 