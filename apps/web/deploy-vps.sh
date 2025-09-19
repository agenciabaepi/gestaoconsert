#!/bin/bash

# Script para deploy automático no VPS
# Execute este script no servidor VPS

echo "🚀 Iniciando deploy da aplicação com correções do Supabase..."
echo "================================================================"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado. Certifique-se de estar no diretório correto."
    exit 1
fi

# Fazer backup dos logs atuais
echo "\n📋 Fazendo backup dos logs atuais..."
mkdir -p logs_backup/$(date +%Y%m%d_%H%M%S)
docker-compose logs > logs_backup/$(date +%Y%m%d_%H%M%S)/app_logs.txt 2>/dev/null || echo "Nenhum log anterior encontrado"

# Parar aplicação atual
echo "\n🛑 Parando aplicação atual..."
docker-compose down

if [ $? -eq 0 ]; then
    echo "✅ Aplicação parada com sucesso"
else
    echo "⚠️  Aviso: Erro ao parar aplicação (pode não estar rodando)"
fi

# Fazer pull das atualizações
echo "\n📥 Fazendo pull das atualizações do repositório..."
git stash push -m "Backup antes do deploy $(date)" 2>/dev/null || echo "Nenhuma alteração local para fazer stash"
git pull origin master

if [ $? -eq 0 ]; then
    echo "✅ Pull concluído com sucesso"
else
    echo "❌ Erro no pull. Verifique a conectividade e permissões."
    exit 1
fi

# Verificar se as correções estão presentes
echo "\n🔍 Verificando correções do Supabase..."
if grep -q "nxamrvfusyrtkcshehfm" docker-compose.yml && grep -q "nxamrvfusyrtkcshehfm" Dockerfile; then
    echo "✅ Correções do Supabase detectadas nos arquivos"
else
    echo "❌ Correções do Supabase não encontradas. Verifique o pull."
    exit 1
fi

# Limpar imagens antigas
echo "\n🗑️  Limpando imagens antigas..."
docker system prune -f
docker image prune -f

# Fazer rebuild da aplicação
echo "\n🔨 Fazendo rebuild da aplicação..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

# Iniciar aplicação
echo "\n🚀 Iniciando aplicação atualizada..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Aplicação iniciada com sucesso"
else
    echo "❌ Erro ao iniciar aplicação."
    exit 1
fi

# Aguardar inicialização
echo "\n⏳ Aguardando inicialização da aplicação..."
sleep 15

# Verificar status dos containers
echo "\n📊 Status dos containers:"
docker-compose ps

# Verificar logs iniciais
echo "\n📋 Logs iniciais da aplicação:"
docker-compose logs --tail=20 app

# Teste de conectividade
echo "\n🔍 Testando conectividade..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Aplicação respondendo em http://localhost:3000"
else
    echo "❌ Aplicação não está respondendo. Verificando logs..."
    docker-compose logs --tail=50 app
fi

# Verificar se os erros de DNS pararam
echo "\n🔍 Verificando se erros de DNS foram resolvidos..."
sleep 5
ERROR_COUNT=$(docker-compose logs --tail=100 app 2>/dev/null | grep -c "ERR_NAME_NOT_RESOLVED.*nxamrvfusyrtkcsehefm" || echo "0")

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ Nenhum erro de DNS detectado nos logs recentes"
else
    echo "❌ Ainda há $ERROR_COUNT erros de DNS nos logs. Investigando..."
    docker-compose logs --tail=50 app | grep "ERR_NAME_NOT_RESOLVED"
fi

echo "\n🎯 Resumo do Deploy:"
echo "================================================================"
echo "✅ Código atualizado do repositório"
echo "✅ Correções do Supabase aplicadas"
echo "✅ Aplicação rebuilded e reiniciada"
echo "\n📝 Próximos passos:"
echo "1. Monitorar logs por alguns minutos: docker-compose logs -f app"
echo "2. Testar login e funcionalidades principais"
echo "3. Verificar se erros de DNS pararam completamente"

echo "\n🔗 Comandos úteis:"
echo "   Logs em tempo real: docker-compose logs -f app"
echo "   Status containers: docker-compose ps"
echo "   Restart aplicação: docker-compose restart app"
echo "   Parar aplicação: docker-compose down"

echo "\n✅ Deploy concluído!"