# 🚀 SOLUÇÃO COMPLETA - VPS NÃO FUNCIONANDO

## ❌ **PROBLEMA IDENTIFICADO:**

A aplicação **funciona em localhost** mas **NÃO funciona no VPS** (gestaoconsert.com.br) devido a:

### **Causa Principal:**
- **URLs do Supabase incorretas** no `docker-compose.yml`
- **Variáveis de ambiente de produção ausentes**
- **NEXT_PUBLIC_SITE_URL incorreta**

### **Configurações Incorretas Encontradas:**
```yaml
# ❌ INCORRETO (no docker-compose.yml atual)
NEXT_PUBLIC_SUPABASE_URL=https://qgqjqjqjqjqjqjqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWpxanFqcWpxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjY5NzQwMCwiZXhwIjoyMDUyMjc0MDAwfQ...
```

```yaml
# ✅ CORRETO (deve ser)
NEXT_PUBLIC_SUPABASE_URL=https://nxamrvfusyrtkcshehfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0Nzg2MTMxMCwiZXhwIjoyMDYzNDM3MzEwfQ...
```

---

## ✅ **SOLUÇÃO APLICADA:**

### **Arquivos Corrigidos:**
1. ✅ **docker-compose.yml** - URLs e chaves do Supabase corrigidas
2. ✅ **fix-vps-production.sh** - Script automatizado criado

### **Correções Implementadas:**
- ✅ URLs do Supabase atualizadas para as corretas
- ✅ Chaves de autenticação do Supabase corrigidas
- ✅ Variável `NEXT_PUBLIC_SITE_URL=https://gestaoconsert.com.br` adicionada
- ✅ Variáveis do Mercado Pago adicionadas
- ✅ Configurações de admin adicionadas

---

## 🛠️ **COMO APLICAR NO VPS:**

### **Opção 1: Script Automatizado (Recomendado)**

```bash
# 1. Acessar o VPS
ssh root@72.60.51.82

# 2. Navegar para o diretório
cd /opt/gestaoconsert/apps/web

# 3. Fazer pull das correções
git pull origin main

# 4. Executar script de correção
chmod +x fix-vps-production.sh
./fix-vps-production.sh
```

### **Opção 2: Manual**

```bash
# 1. Acessar o VPS
ssh root@72.60.51.82
cd /opt/gestaoconsert/apps/web

# 2. Parar containers
docker-compose down

# 3. Fazer backup
cp docker-compose.yml docker-compose.yml.backup

# 4. Fazer pull das correções
git pull origin main

# 5. Reconstruir e iniciar
docker-compose build --no-cache
docker-compose up -d

# 6. Aguardar e verificar
sleep 30
docker-compose ps
docker-compose logs app --tail=20
```

---

## 🔍 **VERIFICAÇÃO PÓS-CORREÇÃO:**

### **1. Verificar Status dos Containers:**
```bash
docker-compose ps
# Todos devem estar "Up"
```

### **2. Verificar Logs:**
```bash
docker-compose logs app --tail=20
# Não deve haver erros de conexão com Supabase
```

### **3. Testar Conectividade:**
```bash
# Testar aplicação local
curl -f http://localhost:3000/

# Testar Supabase
curl -f https://nxamrvfusyrtkcshehfm.supabase.co
```

### **4. Testar no Navegador:**
- ✅ Acessar: https://gestaoconsert.com.br
- ✅ Testar página de cadastro
- ✅ Tentar criar uma empresa
- ✅ Verificar se não há erros no console (F12)

---

## 🚨 **SE AINDA NÃO FUNCIONAR:**

### **Diagnósticos Adicionais:**

```bash
# 1. Verificar variáveis de ambiente
docker-compose exec app env | grep NEXT_PUBLIC

# 2. Verificar logs do nginx
docker-compose logs nginx

# 3. Testar API diretamente
curl -X POST https://gestaoconsert.com.br/api/empresa/criar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@vps.com","senha":"123456","nomeEmpresa":"Empresa VPS","cidade":"São Paulo","endereco":"Rua VPS","plano":"basico"}'

# 4. Verificar certificado SSL
curl -I https://gestaoconsert.com.br
```

### **Possíveis Problemas Adicionais:**
1. **DNS**: Verificar se o domínio aponta para o IP correto
2. **Firewall**: Verificar se as portas 80, 443 estão abertas
3. **SSL**: Verificar se o certificado está válido
4. **Nginx**: Verificar configuração do proxy reverso

---

## 📋 **RESUMO DAS CORREÇÕES:**

| Item | Status | Descrição |
|------|--------|----------|
| URLs Supabase | ✅ Corrigido | `qgqjqjqjqjqjqjqj.supabase.co` → `nxamrvfusyrtkcshehfm.supabase.co` |
| Chaves Supabase | ✅ Corrigido | Chaves atualizadas para as corretas |
| SITE_URL | ✅ Corrigido | Adicionado `NEXT_PUBLIC_SITE_URL=https://gestaoconsert.com.br` |
| Mercado Pago | ✅ Corrigido | Variáveis de produção adicionadas |
| Admin Config | ✅ Corrigido | Configurações de admin adicionadas |
| Script Deploy | ✅ Criado | `fix-vps-production.sh` para automação |

---

## 🎯 **RESULTADO ESPERADO:**

Após aplicar as correções:
- ✅ **https://gestaoconsert.com.br** deve carregar normalmente
- ✅ **Cadastro de empresas** deve funcionar
- ✅ **Conexão com Supabase** deve estar estável
- ✅ **APIs** devem responder corretamente
- ✅ **Sem erros** no console do navegador

---

**⚠️ IMPORTANTE**: Sempre faça backup antes de aplicar as correções!

**📞 SUPORTE**: Se ainda houver problemas, verifique os logs detalhados e a conectividade de rede do VPS.