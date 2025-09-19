# 🚀 Configuração Mercado Pago - PIX

## 📋 Checklist de Implementação

### **1. 🔐 Configurações Mercado Pago**

#### **Conta Mercado Pago:**
- [ ] Criar conta Business no Mercado Pago
- [ ] Ativar PIX na conta
- [ ] Obter credenciais de produção e sandbox

#### **Credenciais Necessárias:**
```env
# Sandbox (Teste)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Produção
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### **2. 🗄️ Banco de Dados**

#### **Executar SQL:**
```sql
-- Executar o arquivo: criar_tabela_pagamentos.sql
```

### **3. 🔧 Variáveis de Ambiente**

#### **Criar arquivo `.env.local`:**
```env
# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=sua_access_token_mercadopago
MERCADOPAGO_PUBLIC_KEY=sua_public_key_mercadopago
MERCADOPAGO_WEBHOOK_SECRET=sua_webhook_secret_mercadopago

# Ambiente
MERCADOPAGO_ENVIRONMENT=sandbox
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **4. 🌐 Webhook (Produção)**

#### **URL do Webhook:**
```
https://www.consert.app/api/pagamentos/webhook
```

#### **Configurar no Mercado Pago:**
1. Acessar painel do Mercado Pago
2. Ir em "Configurações" > "Webhooks"
3. Adicionar URL do webhook
4. Selecionar eventos: `payment.created`, `payment.updated`

### **5. 🔒 SSL (Obrigatório para Produção)**

#### **Para Produção:**
- [ ] Certificado SSL válido
- [ ] HTTPS obrigatório
- [ ] Domínio configurado

### **6. 🧪 Testes**

#### **Sandbox (Teste):**
```javascript
// Testar pagamento
const response = await fetch('/api/pagamentos/criar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    valor: 10.00,
    descricao: 'Teste PIX'
  })
});
```

#### **Dados de Teste:**
- **PIX:** Usar app bancário real
- **Valores:** R$ 1,00 a R$ 10,00
- **Status:** Verificar webhook

### **7. 📱 Integração no Sistema**

#### **Usar Componente:**
```tsx
import PixPayment from '@/components/PixPayment';

<PixPayment 
  valor={100.00}
  ordemServicoId="123"
  descricao="OS #123 - Conserto de iPhone"
  onSuccess={(paymentId) => console.log('Sucesso:', paymentId)}
  onError={(error) => console.error('Erro:', error)}
/>
```

### **8. 📊 Monitoramento**

#### **Logs Importantes:**
- [ ] Webhook recebido
- [ ] Status do pagamento
- [ ] Erros de integração
- [ ] Tempo de resposta

### **9. 🔄 Fluxo Completo**

1. **Cliente solicita pagamento**
2. **Sistema cria preferência no MP**
3. **Salva dados no banco**
4. **Redireciona para MP**
5. **Cliente paga via PIX**
6. **MP envia webhook**
7. **Sistema atualiza status**
8. **Cliente retorna para sucesso/falha**

### **10. 🚨 Troubleshooting**

#### **Problemas Comuns:**

**Webhook não recebido:**
- Verificar URL do webhook
- Verificar SSL em produção
- Verificar logs do servidor

**Pagamento não atualiza:**
- Verificar external_reference
- Verificar permissões do banco
- Verificar logs do webhook

**Erro de credenciais:**
- Verificar ACCESS_TOKEN
- Verificar ambiente (sandbox/production)
- Verificar permissões da conta

### **11. 📈 Próximos Passos**

- [ ] Implementar relatórios de pagamento
- [ ] Adicionar notificações por email
- [ ] Implementar reembolso
- [ ] Adicionar múltiplos métodos de pagamento
- [ ] Implementar assinaturas recorrentes

---

## ✅ Status da Implementação

- [x] Dependências instaladas
- [x] Configuração do Mercado Pago
- [x] Estrutura do banco de dados
- [x] API Routes criadas
- [x] Componente de pagamento
- [x] Páginas de status
- [ ] Credenciais configuradas
- [ ] Webhook configurado
- [ ] Testes realizados
- [ ] Deploy em produção

**Próximo passo:** Configurar as credenciais do Mercado Pago! 🚀 