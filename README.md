# 🚀 Consert Admin SaaS

Sistema completo de gestão para assistências técnicas com painel administrativo separado.

## 📋 Sobre o Projeto

Este é um sistema completo de gestão para assistências técnicas, incluindo:
- **Sistema Principal** - Gestão de OS, clientes, financeiro
- **Painel Admin SaaS** - Administração do sistema
- **App Mobile** - Aplicativo para técnicos

## 🎯 Funcionalidades Principais

### Sistema Web
- ✅ **Dashboard** com estatísticas completas
- ✅ **Gestão de Ordens de Serviço** - CRUD completo
- ✅ **Gestão de Clientes** - Cadastro e histórico
- ✅ **Financeiro** - Controle de caixa e vendas
- ✅ **Bancada** - Controle de equipamentos
- ✅ **Comissões** - Sistema de comissões para técnicos
- ✅ **WhatsApp** - Integração para notificações
- ✅ **Relatórios** - Análises e métricas

### Painel Admin SaaS
- ✅ **Dashboard** com estatísticas do sistema
- ✅ **Gestão de Empresas** - visualizar todas as empresas
- ✅ **Gestão de Usuários** - administrar usuários do sistema
- ✅ **Relatórios** - análises e métricas
- ✅ **Configurações** - configurações do sistema
- ✅ **Segurança** - acesso restrito a super admins

## 🚀 Como Executar

### **1. Instalar Dependências:**
```bash
npm install
```

### **2. Configurar Variáveis de Ambiente:**
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### **3. Executar o Projeto:**
```bash
npm run dev
```

### **4. Acessar:**
```
Sistema Principal: http://localhost:3000
Admin SaaS:        http://localhost:3004
```

## 🔐 Acesso

### **Credenciais de Super Admin:**
```
Email: admin@consert.com
Senha: 123456
```

## 📊 Dashboard

### **Estatísticas Exibidas:**
- 📈 **Total de Empresas** - todas as empresas cadastradas
- 👥 **Total de Usuários** - todos os usuários do sistema
- 💰 **Receita Mensal** - receita das assinaturas ativas
- 🎯 **Trials Ativos** - empresas em período de teste

## 🛡️ Segurança

### **Verificações Implementadas:**
- ✅ Autenticação via Supabase Auth
- ✅ Verificação de nível de acesso
- ✅ Redirecionamento automático para login
- ✅ Logs de debug para troubleshooting

## 📁 Estrutura do Projeto

```
Consert/
├── apps/
│   ├── web/                 # Sistema principal
│   ├── mobile/              # App mobile
│   └── admin-saas/          # Painel administrativo
├── shared/                  # Código compartilhado
├── config/                  # Configurações
└── scripts/                 # Scripts auxiliares
```

## �� Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **Lucide React** - Ícones
- **Recharts** - Gráficos

---

**🎉 Sistema Consert funcionando perfeitamente!**

**Sistema completo de gestão para assistências técnicas com todas as funcionalidades implementadas!**
