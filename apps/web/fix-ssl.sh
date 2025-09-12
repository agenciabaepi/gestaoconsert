#!/bin/bash

# Script para criar certificados SSL temporários e corrigir o site

echo "🚨 CORREÇÃO URGENTE - Criando certificados SSL..."

# Criar diretório SSL se não existir
mkdir -p /etc/nginx/ssl

# Gerar certificado auto-assinado
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/gestaoconsert.com.br.key \
    -out /etc/nginx/ssl/gestaoconsert.com.br.crt \
    -subj "/C=BR/ST=Estado/L=Cidade/O=GestaConsert/CN=gestaoconsert.com.br"

# Definir permissões corretas
chmod 600 /etc/nginx/ssl/gestaoconsert.com.br.key
chmod 644 /etc/nginx/ssl/gestaoconsert.com.br.crt

echo "✅ Certificados SSL criados!"

# Navegar para projeto
cd /opt/gestaoconsert

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Reiniciar containers
echo "🔄 Reiniciando containers..."
docker-compose down
docker-compose up -d

echo "✅ Site deve estar funcionando agora!"
echo "🌐 Teste: https://www.gestaoconsert.com.br"
