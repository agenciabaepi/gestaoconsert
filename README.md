<<<<<<< HEAD
# Admin Panel - Gestão Consert

Painel administrativo completo para gerenciar empresas, usuários e configurações do sistema SaaS Gestão Consert.

## 🚀 Funcionalidades

### Dashboard Principal
- Visão geral das métricas do sistema
- Estatísticas de empresas, usuários e receita
- Atividades recentes e ações rápidas
- Cards informativos com gráficos

### Gestão de Empresas
- Listagem completa de empresas cadastradas
- Filtros por status (ativa, inativa, pendente)
- Busca por nome, CNPJ ou email
- Ações de ativação/desativação
- Visualização de planos e usuários por empresa

### Módulo Financeiro
- Controle de pagamentos e receitas
- Relatórios financeiros detalhados
- Analytics de performance
- Gestão de faturas e cobranças
- Métricas de MRR, ARR e churn rate

### Gestão de Usuários
- Administração de usuários do sistema
- Controle de permissões e funções
- Status de usuários (ativo, inativo, pendente)
- Histórico de login e atividades

### Configurações do Sistema
- Configurações gerais do sistema
- Parâmetros de email e banco de dados
- Configurações de segurança
- Gerenciamento de notificações
- Status dos serviços e uptime

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Radix UI** - Componentes acessíveis
- **Framer Motion** - Animações
=======
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
>>>>>>> ae80de9f9e96904a86bf9fd02b9f22ffd98f1f2a

## 📁 Estrutura do Projeto

```
<<<<<<< HEAD
src/
├── app/                    # Páginas da aplicação
│   ├── companies/         # Gestão de empresas
│   ├── financial/         # Módulo financeiro
│   ├── settings/          # Configurações
│   ├── users/             # Gestão de usuários
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Dashboard
├── components/            # Componentes reutilizáveis
│   ├── layout/            # Componentes de layout
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/                # Componentes UI base
│       ├── card.tsx
│       ├── button.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       └── DashboardCard.tsx
└── lib/                   # Utilitários
    └── utils.ts           # Funções auxiliares
```

## 🎨 Design System

O painel segue o mesmo padrão visual do sistema principal:

- **Cores**: Paleta verde (#D1FE6E, #B8E55A) com acentos
- **Tipografia**: Inter como fonte principal
- **Componentes**: Cards, botões e tabelas consistentes
- **Layout**: Sidebar colapsível e header responsivo
- **Animações**: Transições suaves e scroll reveal

## 🚀 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

## 📱 Responsividade

O painel é totalmente responsivo com:
- Sidebar colapsível em telas menores
- Menu mobile com overlay
- Tabelas com scroll horizontal
- Cards que se adaptam ao tamanho da tela

## 🔐 Segurança

- Autenticação de administradores
- Proteção de rotas sensíveis
- Controle de permissões por usuário
- Logs de atividades do sistema

## 📊 Métricas e Analytics

- Dashboard com KPIs principais
- Relatórios financeiros detalhados
- Analytics de uso do sistema
- Monitoramento de performance

## 🎯 Próximos Passos

- [ ] Implementar autenticação real
- [ ] Conectar com banco de dados
- [ ] Adicionar gráficos interativos
- [ ] Implementar notificações em tempo real
- [ ] Adicionar logs de auditoria
- [ ] Criar relatórios exportáveis

## 📄 Licença

Este projeto é propriedade da Gestão Consert e está protegido por direitos autorais.

---

**Desenvolvido para Gestão Consert** - Sistema de gestão para empresas de conserto e manutenção.
=======
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
>>>>>>> ae80de9f9e96904a86bf9fd02b9f22ffd98f1f2a
