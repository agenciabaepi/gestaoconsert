# AgilizaOS – Sistema de Ordem de Serviço e Financeiro para Assistências Técnicas

## 📦 Estrutura do Projeto
- `apps/web` – Plataforma Web (Next.js + TailwindCSS)
- `apps/mobile` – App Mobile (Expo + React Native)
- `backend/functions` – Backend com Firebase Functions
- `shared/` – Código compartilhado entre web e mobile
- `config/` – Arquivos de configuração
- `scripts/` – Scripts auxiliares de build e deploy
- `public/` – Logos, termos e arquivos públicos

## 🚀 Como rodar o projeto

### Web (Next.js)
```bash
cd apps/web
npm install
npm run dev
```

### Mobile (Expo)
```bash
cd apps/mobile
npm install
npx expo start
```

### Backend (Firebase)
```bash
cd backend
firebase init functions
cd functions
npm install
firebase emulators:start
```

## 🔐 Variáveis de Ambiente (.env)
Exemplo de chaves mínimas:
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
```

## 📄 Instrução do Projeto
O documento completo de funcionalidades está no arquivo:
```
INSTRUCAO_PROJETO_SAAS_ASSISTENCIA.txt
```

---

> Última atualização: 13/05/2025
