#!/bin/bash

# Script de Deploy Automatizado
# Para usar: ssh root@SEU_IP 'bash -s' < deploy.sh

echo "🚀 Iniciando deploy automatizado..."

# Navegar para o diretório do projeto
cd /opt/gestaoconsert || { echo "❌ Erro: Diretório não encontrado"; exit 1; }

echo "📥 Atualizando código..."
git pull origin main

echo "🛑 Parando containers..."
docker-compose down

echo "🧹 Limpando containers e imagens antigas..."
docker system prune -f
docker image prune -a -f

echo "🔨 Construindo nova imagem..."
cd apps/web
docker-compose build --no-cache
cd ../..

echo "🚀 Iniciando containers..."
docker-compose up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 30

echo "📊 Status dos containers:"
docker-compose ps

echo "📋 Logs da aplicação:"
docker-compose logs app --tail=20

echo "🏥 Testando health check..."
curl -f http://localhost:3001/health || echo "⚠️ Health check falhou"

echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://www.gestaoconsert.com.br"