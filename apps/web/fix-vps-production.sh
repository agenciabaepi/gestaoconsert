#!/bin/bash

# Script para corrigir problemas de produção no VPS
# Executa as correções necessárias para fazer a aplicação funcionar online

echo "🔧 CORREÇÃO DE PRODUÇÃO - GESTÃO CONCERT"
echo "==========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado!"
    echo "Execute este script no diretório /opt/gestaoconsert/apps/web"
    exit 1
fi

echo "📍 Diretório atual: $(pwd)"
echo "📋 Problemas identificados:"
echo "   - URLs do Supabase incorretas no docker-compose.yml"
echo "   - Variáveis de ambiente de produção ausentes"
echo "   - NEXT_PUBLIC_SITE_URL incorreta"
echo ""

echo "🛑 Parando containers..."
docker-compose down

echo "📝 Fazendo backup do docker-compose.yml atual..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

echo "🔄 Aplicando correções no docker-compose.yml..."

# Criar novo docker-compose.yml com configurações corretas
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    build:
      context: .
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=https://nxamrvfusyrtkcshehfm.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0Nzg2MTMxMCwiZXhwIjoyMDYzNDM3MzEwfQ.CWTKEVlWcMeRTv8kHgsPkk-WzoHxypFDb_QSf-DLPAQ
      - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzQ3ODYxMzEwLCJleHAiOjIwNjM0MzczMTB9.ax2dDACyrsila_Z97fjupFITA7DplPOTXoqyp-bezKc
      - NEXT_PUBLIC_SITE_URL=https://gestaoconsert.com.br
      - MERCADOPAGO_ACCESS_TOKEN=APP_USR-3752420980879882-080316-e6ea366b73ee5fcbcd2f4aeb8049886e-2502171526
      - MERCADOPAGO_ENVIRONMENT=sandbox
      - PLATFORM_ADMIN_EMAILS=lucas@hotmail.com
      - ADMIN_SAAS_ACCESS_CODE=093718
      - ADMIN_SAAS_OPEN=1
    expose:
      - "3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/nginx-config/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    entrypoint: /bin/sh -c "trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h; done"
    restart: unless-stopped
EOF

echo "✅ docker-compose.yml atualizado com configurações corretas!"
echo ""

echo "🧹 Limpando cache do Docker..."
docker system prune -f
docker image prune -a -f

echo "🔨 Reconstruindo aplicação..."
docker-compose build --no-cache

echo "🚀 Iniciando containers..."
docker-compose up -d

echo "⏳ Aguardando inicialização (30 segundos)..."
sleep 30

echo "📊 Status dos containers:"
docker-compose ps
echo ""

echo "📋 Logs da aplicação (últimas 10 linhas):"
docker-compose logs app --tail=10
echo ""

echo "🔍 Testando conectividade..."
echo "   - Testando localhost:3000..."
curl -f http://localhost:3000/ > /dev/null 2>&1 && echo "   ✅ Localhost OK" || echo "   ❌ Localhost falhou"

echo "   - Testando Supabase..."
curl -f https://nxamrvfusyrtkcshehfm.supabase.co > /dev/null 2>&1 && echo "   ✅ Supabase OK" || echo "   ❌ Supabase falhou"

echo ""
echo "✅ CORREÇÕES APLICADAS COM SUCESSO!"
echo "==========================================="
echo "🌐 Acesse: https://gestaoconsert.com.br"
echo "📝 Teste o cadastro de empresas"
echo "📊 Monitore os logs: docker-compose logs -f app"
echo ""
echo "🔧 Se ainda houver problemas:"
echo "   1. Verifique os logs: docker-compose logs app"
echo "   2. Verifique o nginx: docker-compose logs nginx"
echo "   3. Teste a API: curl -X POST https://gestaoconsert.com.br/api/empresa/criar"
echo ""
echo "📁 Backup salvo em: docker-compose.yml.backup.*"