#!/bin/bash

# Script de deploy para VPS Hostinger
# Domínio: gestaoconsert.com.br

echo "🚀 Iniciando deploy do Gestão Consert..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Iniciando..."
    systemctl start docker
    sleep 5
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Fazer pull das últimas alterações
echo "📥 Fazendo pull das últimas alterações..."
git pull origin main

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose build --no-cache
docker-compose up -d

# Aguardar aplicação inicializar
echo "⏳ Aguardando aplicação inicializar..."
sleep 30

# Verificar status
echo "🔍 Verificando status dos containers..."
docker-compose ps

# Verificar logs
echo "📋 Últimos logs da aplicação:"
docker-compose logs --tail=20 app

# Health check
echo "🏥 Fazendo health check..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Deploy realizado com sucesso!"
    echo "🌐 Acesse: https://gestaoconsert.com.br"
else
    echo "❌ Erro no health check. Verifique os logs."
    exit 1
fi

# Limpar imagens não utilizadas
echo "🧹 Limpando imagens não utilizadas..."
docker system prune -f

echo "🎉 Deploy concluído!"
