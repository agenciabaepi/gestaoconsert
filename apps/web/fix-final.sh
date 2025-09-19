#!/bin/bash

echo "🚨 CORREÇÃO DEFINITIVA - Resolvendo conflitos SSL/Docker"

# 1. Parar TUDO
echo "🛑 Parando todos os serviços..."
docker-compose down
systemctl stop nginx
pkill -f nginx
pkill -f docker

# 2. Limpar tudo
echo "🧹 Limpando sistema..."
docker system prune -af
iptables -F
iptables -t nat -F

# 3. Criar nginx.conf simples que funciona
echo "📝 Criando configuração nginx simples..."
cat > /opt/nginx-config/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # HTTP - redireciona para HTTPS
    server {
        listen 80;
        server_name gestaoconsert.com.br www.gestaoconsert.com.br;
        return 301 https://www.gestaoconsert.com.br$request_uri;
    }

    # HTTPS principal
    server {
        listen 443 ssl http2;
        server_name www.gestaoconsert.com.br gestaoconsert.com.br;

        # SSL
        ssl_certificate /etc/letsencrypt/live/gestaoconsert.com.br/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/gestaoconsert.com.br/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Proxy para app
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 4. Reiniciar Docker
echo "🐳 Reiniciando Docker..."
systemctl restart docker
sleep 5

# 5. Subir aplicação
echo "🚀 Iniciando aplicação..."
cd /opt/gestaoconsert
docker-compose up -d

# 6. Aguardar e testar
echo "⏳ Aguardando inicialização..."
sleep 30

echo "🔍 Testando..."
curl -I http://www.gestaoconsert.com.br
curl -I https://www.gestaoconsert.com.br

echo "📊 Status containers:"
docker-compose ps

echo "✅ CONCLUÍDO!"
echo "🌐 Teste: https://www.gestaoconsert.com.br"
