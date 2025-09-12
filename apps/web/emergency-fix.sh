#!/bin/bash

echo "🚨 CORREÇÃO EMERGENCIAL - Abordagem mais simples"

# 1. Usar apenas Nginx do sistema (sem Docker)
echo "📋 Criando configuração Nginx direta no sistema..."

# Parar Docker nginx
docker-compose down
docker stop $(docker ps -q) 2>/dev/null

# Configurar Nginx do sistema
cat > /etc/nginx/sites-available/gestaoconsert << 'EOF'
server {
    listen 80;
    server_name gestaoconsert.com.br www.gestaoconsert.com.br;
    return 301 https://www.gestaoconsert.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.gestaoconsert.com.br gestaoconsert.com.br;

    ssl_certificate /etc/letsencrypt/live/gestaoconsert.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gestaoconsert.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/gestaoconsert /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Subir apenas a aplicação Docker (sem nginx)
echo "🐳 Subindo apenas a aplicação..."
cd /opt/gestaoconsert

# Modificar docker-compose temporariamente
cat > docker-compose-temp.yml << 'EOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
EOF

docker-compose -f docker-compose-temp.yml up -d

echo "⏳ Aguardando aplicação iniciar..."
sleep 30

echo "🔍 Testando..."
curl -I http://localhost:3001
curl -I https://www.gestaoconsert.com.br

echo "📊 Status:"
systemctl status nginx
docker-compose -f docker-compose-temp.yml ps

echo "✅ CONCLUÍDO!"
echo "🌐 Teste: https://www.gestaoconsert.com.br"
