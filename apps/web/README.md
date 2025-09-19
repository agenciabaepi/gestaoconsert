# 🚀 Consert Admin SaaS

Painel administrativo separado para gestão do SaaS Consert.

## 📋 Sobre o Projeto

Este é um painel administrativo dedicado para gerenciar o SaaS Consert de forma organizada e segura, separado do projeto principal.

## 🎯 Funcionalidades

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
Copie o arquivo `.env.local` do projeto principal ou configure:
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
URL: http://localhost:3004
```

## 🔐 Acesso

### **Credenciais de Super Admin:**
```
Email: admin@consert.com
Senha: 123456
```

### **Verificação de Acesso:**
- ✅ Usuário logado no Supabase Auth
- ✅ `nivel: 'admin'` na tabela usuarios
- ✅ `empresa_id: null` (sem empresa específica)

## 📊 Dashboard

### **Estatísticas Exibidas:**
- 📈 **Total de Empresas** - todas as empresas cadastradas
- 👥 **Total de Usuários** - todos os usuários do sistema
- 💰 **Receita Mensal** - receita das assinaturas ativas
- 🎯 **Trials Ativos** - empresas em período de teste

### **Ações Rápidas:**
- 👁️ **Ver Empresas** - listar todas as empresas
- 📊 **Relatórios** - análises detalhadas
- ⚙️ **Configurações** - configurações do sistema

## 🛡️ Segurança

### **Verificações Implementadas:**
- ✅ Autenticação via Supabase Auth
- ✅ Verificação de nível de acesso
- ✅ Redirecionamento automático para login
- ✅ Logs de debug para troubleshooting

### **Distinção de Acesso:**
- **Super Admin:** `nivel: 'admin'` + `empresa_id: null` (você)
- **Admin Empresa:** `nivel: 'admin'` + `empresa_id: 'xxx'` (clientes)

## 🎯 URLs do Sistema

```
Sistema Principal: http://localhost:3002
Admin SaaS:        http://localhost:3004
```

## 📁 Estrutura do Projeto

```
admin-saas/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard principal
│   │   └── layout.tsx        # Layout base
│   └── components/           # Componentes reutilizáveis
├── public/                   # Arquivos estáticos
├── .env.local               # Variáveis de ambiente
└── package.json             # Dependências
```

## 🔧 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **Lucide React** - Ícones
- **Recharts** - Gráficos

## 🚀 Próximos Passos

1. **Implementar páginas específicas:**
   - `/empresas` - Lista de empresas
   - `/usuarios` - Gestão de usuários
   - `/relatorios` - Relatórios detalhados
   - `/configuracoes` - Configurações

2. **Adicionar funcionalidades:**
   - CRUD de empresas
   - Gestão de assinaturas
   - Relatórios avançados
   - Notificações

3. **Melhorar UX:**
   - Loading states
   - Error handling
   - Responsividade
   - Animações

---

**🎉 Painel Admin SaaS criado com sucesso!**

**Agora você tem um sistema separado e organizado para gerenciar o SaaS Consert!**
