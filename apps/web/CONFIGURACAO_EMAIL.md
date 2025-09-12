# 📧 Configuração do Sistema de Verificação por Email

## 🎯 **O que foi implementado:**

### ✅ **Sistema completo de verificação por email:**
1. **Código de 6 dígitos** enviado por email após cadastro
2. **Página de verificação** dedicada com interface amigável
3. **Bloqueio automático** de usuários não verificados
4. **API completa** para envio, verificação e reenvio de códigos
5. **Emails HTML responsivos** com design profissional

---

## 🛠️ **Configuração necessária:**

### **1. Variáveis de ambiente:**
Adicione no arquivo `.env.local` (local) ou `.env` (produção):

```env
# Configurações de E-mail (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=suporte@gestaoconsert.com.br
SMTP_PASS=@Deusefiel7loja2025
```

### **2. Executar SQL no Supabase:**
Execute o arquivo `src/lib/sql/tabela_codigo_verificacao.sql` no Supabase SQL Editor.

---

## 🔄 **Fluxo do sistema:**

### **1. Cadastro:**
- Usuário preenche formulário de cadastro
- Sistema cria conta no Supabase Auth
- Sistema gera código de 6 dígitos
- Email é enviado automaticamente
- Usuário é redirecionado para `/verificar-email`

### **2. Verificação:**
- Usuário digita código de 6 dígitos
- Sistema valida código e marca email como verificado
- Usuário é redirecionado para login

### **3. Login:**
- Middleware verifica se email foi verificado
- Se não verificado, redireciona para `/verificar-email`
- Se verificado, permite acesso ao sistema

---

## 📧 **APIs criadas:**

### **`POST /api/email/enviar-codigo`**
Envia código de verificação para um usuário.

```json
{
  "usuarioId": "uuid",
  "email": "usuario@email.com", 
  "nomeEmpresa": "Nome da Empresa"
}
```

### **`POST /api/email/verificar-codigo`**
Verifica código de 6 dígitos.

```json
{
  "email": "usuario@email.com",
  "codigo": "123456"
}
```

### **`POST /api/email/reenviar-codigo`**
Reenvia código para usuário não verificado.

```json
{
  "email": "usuario@email.com"
}
```

---

## 🗃️ **Estrutura do banco:**

### **Tabela `codigo_verificacao`:**
- `id` - UUID primário
- `usuario_id` - Referência ao usuário
- `codigo` - Código de 6 dígitos
- `email` - Email do usuário
- `usado` - Se o código foi usado
- `expira_em` - Data de expiração (24h)
- `criado_em` - Data de criação
- `usado_em` - Data de uso

### **Campo adicionado em `usuarios`:**
- `email_verificado` - Boolean indicando se email foi verificado

---

## 🎨 **Páginas criadas:**

### **`/verificar-email`**
- Interface limpa e profissional
- Campo para código de 6 dígitos
- Botão para reenviar código
- Informações sobre validade (24h)
- Redirecionamento automático após verificação

---

## 🔒 **Segurança implementada:**

1. **Códigos únicos** - Cada código é único e tem validade de 24h
2. **Invalidação automática** - Códigos antigos são invalidados ao gerar novos
3. **RLS (Row Level Security)** - Usuários só veem seus próprios códigos
4. **Middleware de proteção** - Bloqueia acesso até verificação
5. **Limpeza automática** - Função para remover códigos expirados

---

## 📱 **Design do email:**

- **Layout responsivo** para desktop e mobile
- **Código destacado** em fonte grande e colorida
- **Informações claras** sobre validade e uso
- **Branding consistente** com o sistema
- **Instruções detalhadas** para o usuário

---

## 🚀 **Deploy:**

1. **Configurar variáveis de ambiente** no VPS
2. **Executar SQL** no Supabase
3. **Fazer deploy** da aplicação
4. **Testar fluxo completo** de cadastro e verificação

---

## ✅ **Pronto para uso!**

O sistema está completo e pronto para produção. Basta configurar as variáveis de ambiente do SMTP da Hostinger e executar o SQL no Supabase.
