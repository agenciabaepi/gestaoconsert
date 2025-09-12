# 🚀 DEPLOY NO VPS - CORRIGIR CADASTRO

## ❌ **PROBLEMA IDENTIFICADO:**
- **Cadastro funciona em localhost** ✅
- **Cadastro NÃO funciona no VPS** ❌
- **Erro 500** ao tentar cadastrar empresa

## 🔍 **CAUSA DO PROBLEMA:**
- **Variável de ambiente incorreta**: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- **Deve ser**: `NEXT_PUBLIC_SITE_URL=https://gestaoconsert.com.br`

## 🛠️ **SOLUÇÃO COMPLETA:**

### **1. Acessar o VPS:**
```bash
ssh root@72.60.51.82
cd /opt/gestaoconsert
```

### **2. Parar a aplicação atual:**
```bash
docker-compose down
```

### **3. Configurar variáveis de ambiente:**
```bash
# Criar arquivo .env com configurações corretas
cat > .env << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nxamrvfusyrtkcshehfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0Nzg2MTMxMCwiZXhwIjoyMDYzNDM3MzEwfQ.CWTKEVlWcMeRTv8kHgsPkk-WzoHxypFDb_QSf-DLPAQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzQ3ODYxMzEwLCJleHAiOjIwNjM0MzczMTB9.ax2dDACyrsila_Z97fjupFITA7DplPOTXoqyp-bezKc

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3752420980879882-080316-e6ea366b73ee5fcbcd2f4aeb8049886e-2502171526
MERCADOPAGO_ENVIRONMENT=sandbox

# Site URL para produção
NEXT_PUBLIC_SITE_URL=https://gestaoconsert.com.br

# Admin
PLATFORM_ADMIN_EMAILS=lucas@hotmail.com
ADMIN_SAAS_ACCESS_CODE=093718
ADMIN_SAAS_OPEN=1
EOF
```

### **4. Fazer pull das correções:**
```bash
git pull origin main
```

### **5. Reconstruir e iniciar:**
```bash
# Dar permissão ao script de deploy
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### **6. Verificar se funcionou:**
```bash
# Ver status dos containers
docker-compose ps

# Ver logs da aplicação
docker-compose logs -f app

# Testar API de cadastro
curl -X POST https://gestaoconsert.com.br/api/empresa/criar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@vps.com","senha":"123456","nomeEmpresa":"Empresa VPS","cidade":"São Paulo","endereco":"Rua VPS","plano":"basico"}'
```

## 🔧 **ALTERNATIVA MANUAL:**

### **Se o script não funcionar:**
```bash
# Construir manualmente
docker-compose build --no-cache

# Iniciar
docker-compose up -d

# Aguardar inicialização
sleep 30

# Verificar logs
docker-compose logs app
```

## ✅ **VERIFICAÇÃO FINAL:**

### **1. Acessar o site:**
- **URL**: https://gestaoconsert.com.br
- **Página**: /cadastro
- **Teste**: Tentar cadastrar uma empresa

### **2. Verificar no console do navegador:**
- **F12** → Console
- **Procurar por erros** relacionados ao cadastro

### **3. Verificar logs do VPS:**
```bash
docker-compose logs app | grep -i "cadastro\|empresa\|criar"
```

## 🚨 **SE AINDA NÃO FUNCIONAR:**

### **Verificar:**
1. **SSL**: Certificado válido em https://gestaoconsert.com.br
2. **DNS**: Domínio apontando para o IP correto
3. **Firewall**: Portas 80, 443 e 3000 abertas
4. **Banco**: Supabase acessível do VPS

### **Comandos de diagnóstico:**
```bash
# Verificar conectividade com Supabase
curl -I https://nxamrvfusyrtkcshehfm.supabase.co

# Verificar status do nginx
docker-compose logs nginx

# Verificar variáveis de ambiente
docker-compose exec app env | grep NEXT_PUBLIC
```

## 🎯 **RESULTADO ESPERADO:**
- ✅ **Cadastro funcionando** em https://gestaoconsert.com.br
- ✅ **API retornando 200** ao criar empresa
- ✅ **Empresa criada** no banco de dados
- ✅ **Usuário criado** e vinculado à empresa

---

**⚠️ IMPORTANTE**: Sempre faça backup antes de fazer alterações no VPS!
