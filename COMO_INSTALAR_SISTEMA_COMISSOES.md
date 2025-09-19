# 🚀 Como Instalar o Sistema de Comissões

## 📋 Ordem de Execução dos Scripts

Execute os scripts SQL na seguinte ordem **exata**:

### **1️⃣ Primeiro: Criar Estrutura**
```sql
-- Execute no seu banco de dados PostgreSQL/Supabase
\i 01_criar_tabelas_comissoes.sql
```
**O que faz:**
- ✅ Adiciona colunas de comissão na tabela `usuarios`
- ✅ Adiciona coluna `tipo` na tabela `ordens_servico`
- ✅ Cria tabela `configuracoes_comissao`
- ✅ Cria tabela `comissoes_historico`
- ✅ Cria índices para performance
- ✅ Insere configurações padrão para empresas existentes

### **2️⃣ Segundo: Criar Trigger Automático**
```sql
-- Execute após o script 1
\i 02_criar_trigger_comissoes.sql
```
**O que faz:**
- ✅ Cria função `calcular_comissao_entrega()`
- ✅ Cria trigger que calcula comissão automaticamente
- ✅ Verifica se trigger foi criado corretamente

### **3️⃣ Terceiro: Popular Dados de Teste (Opcional)**
```sql
-- Execute após os scripts 1 e 2
\i 03_popular_dados_teste_comissoes.sql
```
**O que faz:**
- ✅ Ativa comissão de 10% para todos os técnicos
- ✅ Configura algumas OSs como ENTREGUE para teste
- ✅ Cria OSs de retorno para teste
- ✅ Mostra relatórios de verificação

## ⚠️ Importante

### **Verificações de Segurança:**
- ✅ Scripts usam `IF NOT EXISTS` para evitar erros
- ✅ Scripts verificam se colunas existem antes de usar
- ✅ Scripts são idempotentes (podem ser executados múltiplas vezes)

### **Ordem Obrigatória:**
1. **PRIMEIRO** → `01_criar_tabelas_comissoes.sql`
2. **SEGUNDO** → `02_criar_trigger_comissoes.sql`  
3. **TERCEIRO** → `03_popular_dados_teste_comissoes.sql` (opcional)

## 🎯 Após a Instalação

### **Interface Web:**
1. **Acesse** Configurações → Comissões (apenas admins)
2. **Configure** percentuais por técnico
3. **Ajuste** regras da empresa

### **Funcionamento Automático:**
- ✅ Comissões são calculadas automaticamente quando OS é marcada como "ENTREGUE"
- ✅ Técnicos veem ganhos no dashboard em tempo real
- ✅ Histórico completo fica salvo para auditoria

## 🔧 Configurações Disponíveis

### **Por Empresa:**
- **Percentual padrão** para novos técnicos
- **Base de cálculo**: apenas serviços ou serviços + peças
- **Retornos/garantias**: com ou sem comissão

### **Por Técnico:**
- **Percentual individual** de comissão
- **Ativar/desativar** comissões
- **Observações** personalizadas

## 📊 Relatórios

### **Para Técnicos:**
- Dashboard atualizado com comissões reais
- Comparação mensal
- Crescimento percentual

### **Para Admins:**
- Histórico completo de comissões
- Configurações centralizadas
- Auditoria por período

## 🐛 Solução de Problemas

### **Erro: "column does not exist"**
- ✅ Execute primeiro o script `01_criar_tabelas_comissoes.sql`

### **Trigger não funciona:**
- ✅ Execute o script `02_criar_trigger_comissoes.sql`

### **Comissões não aparecem:**
- ✅ Verifique se técnico tem `comissao_ativa = true`
- ✅ Verifique se OS foi marcada como "ENTREGUE"
- ✅ Verifique se OS tem `tecnico_id` definido

## ✅ Verificação Final

Execute esta query para verificar se tudo foi instalado:

```sql
-- Verificar estrutura criada
SELECT 
  'usuarios' as tabela,
  COUNT(*) as tecnicos_com_comissao
FROM usuarios 
WHERE comissao_ativa = true

UNION ALL

SELECT 
  'configuracoes_comissao' as tabela,
  COUNT(*) as empresas_configuradas
FROM configuracoes_comissao

UNION ALL

SELECT 
  'comissoes_historico' as tabela,
  COUNT(*) as comissoes_calculadas
FROM comissoes_historico;
```

## 🎉 Pronto!

Seu sistema de comissões está funcionando! 🚀
