# Processo de Login Após Cadastro

## 📋 **Fluxo Completo**

### 1. **Cadastro da Empresa**
- Usuário acessa `/cadastro`
- Preenche dados em 3 passos:
  - Escolha do plano
  - Dados da empresa
  - Dados pessoais
- Sistema cria automaticamente:
  - Usuário no Supabase Auth
  - Empresa no banco
  - Usuário admin
  - Assinatura trial (15 dias)

### 2. **Página de Sucesso**
- Usuário é redirecionado para `/cadastro/sucesso`
- Explica o processo de login
- Mostra informações importantes
- Redirecionamento automático para login

### 3. **Login**
- Usuário acessa `/login`
- Usa o **e-mail** e **senha** cadastrados
- Sistema verifica assinatura
- Redireciona para dashboard

## 🔐 **Como Fazer Login**

### **Dados Necessários:**
- **E-mail**: O mesmo usado no cadastro
- **Senha**: A senha criada no cadastro

### **Passos:**
1. Acesse: `http://localhost:3001/login`
2. Digite seu e-mail
3. Digite sua senha
4. Clique em "Entrar"

### **Recuperação de Senha:**
- Clique em "Esqueci minha senha"
- Digite seu e-mail
- Receba link de recuperação

## ⚠️ **Possíveis Problemas**

### **"Usuário não encontrado"**
- Verifique se o e-mail está correto
- Confirme se o cadastro foi concluído

### **"Erro ao fazer login"**
- Verifique se a senha está correta
- Tente recuperar a senha

### **"Acesso bloqueado"**
- Entre em contato com o suporte
- Verifique se a empresa não foi bloqueada

## 🎯 **Informações Importantes**

### **Trial de 15 dias:**
- Acesso completo às funcionalidades
- Sem cartão de crédito
- Pode fazer upgrade a qualquer momento

### **Dados Seguros:**
- Todos os dados ficam na nuvem
- Backup automático
- Criptografia de ponta a ponta

### **Suporte:**
- Disponível durante o trial
- Chat online
- E-mail de suporte

## 📞 **Contato**

Se tiver problemas para fazer login:
- **E-mail**: suporte@agilizaos.com
- **WhatsApp**: (11) 99999-9999
- **Horário**: Segunda a Sexta, 8h às 18h 