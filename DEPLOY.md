# 🚀 Guia de Deploy - Gestão Consert

## 🌐 Domínio: gestaoconsert.com.br
## 🖥️ VPS: 72.60.51.82

## 📋 PRÉ-REQUISITOS

### 1. Acesso SSH ao VPS
```bash
ssh root@72.60.51.82
```

### 2. Instalar Docker no VPS
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Iniciar Docker
systemctl start docker
systemctl enable docker
```

## 🚀 DEPLOY MANUAL

### 1. Clonar repositório
```bash
cd /opt
git clone https://github.com/seu-usuario/gestaoconsert.git
cd gestaoconsert
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
nano .env
```

**Configurar:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Executar deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔄 DEPLOY AUTOMÁTICO (GitHub Actions)

### 1. Configurar Secrets no GitHub
- `VPS_HOST`: 72.60.51.82
- `VPS_USERNAME`: root
- `VPS_SSH_KEY`: Chave SSH privada
- `VPS_PORT`: 22

### 2. Push para main/master
```bash
git add .
git commit -m "Deploy automático"
git push origin main
```

## 🌐 CONFIGURAÇÃO DE DOMÍNIO

### 1. DNS Records
```
A     gestaoconsert.com.br    72.60.51.82
A     www.gestaoconsert.com.br    72.60.51.82
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx

# Gerar certificado
certbot --nginx -d gestaoconsert.com.br -d www.gestaoconsert.com.br
```

## 📊 MONITORAMENTO

### 1. Status dos containers
```bash
docker-compose ps
```

### 2. Logs da aplicação
```bash
docker-compose logs -f app
```

### 3. Health check
```bash
curl https://gestaoconsert.com.br/health
```

## 🔧 TROUBLESHOOTING

### WhatsApp não funciona
```bash
# Verificar logs do Puppeteer
docker-compose logs app | grep -i puppeteer

# Verificar sessões
ls -la whatsapp-sessions/
```

### Aplicação não inicia
```bash
# Verificar logs
docker-compose logs app

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🎯 VANTAGENS DO VPS

- ✅ **WhatsApp funcionando perfeitamente**
- ✅ **Sessões persistentes**
- ✅ **Performance superior**
- ✅ **Sem limitações de tamanho**
- ✅ **Controle total do ambiente**

## 📞 SUPORTE

Para problemas técnicos, verifique:
1. Logs dos containers
2. Status do Docker
3. Configuração do domínio
4. Certificados SSL
