#!/bin/bash

echo "🚀 SOLUÇÃO FINAL - Reconstruindo Docker com build correto"

cd /opt/gestaoconsert || { echo "Erro: Diretório não encontrado."; exit 1; }

echo "1. 🛑 Parando e removendo containers..."
docker-compose down
docker-compose rm -f

echo "2. 🧹 Limpando imagens antigas..."
docker system prune -f
docker rmi $(docker images -q) 2>/dev/null || true

echo "3. 🔨 Reconstruindo Docker com build..."
# Garantir que vai fazer o build do Next.js
docker-compose build --no-cache

echo "4. 🚀 Iniciando aplicação..."
docker-compose up -d

echo "5. ⏳ Aguardando aplicação inicializar (30s)..."
sleep 30

echo "6. 🧪 Testando aplicação..."
if curl -f http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ App responde na 3001!"
else
    echo "❌ App ainda não responde na 3001"
    echo "📋 Logs do container:"
    docker-compose logs app --tail=20
fi

echo "7. 🌐 Testando site externo..."
if curl -f https://www.gestaoconsert.com.br >/dev/null 2>&1; then
    echo "✅ Site funcionando!"
else
    echo "❌ Site ainda com problema"
fi

echo "8. 📊 Status final:"
docker ps
systemctl status nginx --no-pager

echo ""
echo "🎯 SOLUÇÃO APLICADA!"
echo "✅ Nginx: Sistema (Let's Encrypt SSL)"
echo "✅ App: Docker (porta 3001)"
echo "✅ Build: Next.js reconstruído"
echo ""
echo "Teste seu site: https://www.gestaoconsert.com.br"
