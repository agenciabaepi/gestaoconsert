#!/bin/bash

echo "🚀 DEPLOY COMPLETO DO SISTEMA DE MONITORAMENTO"
echo "=============================================="

# Transferir arquivos para o VPS
VPS_IP="72.60.51.82"
VPS_USER="root"

echo "📤 Transferindo arquivos para o VPS..."

# Criar diretório temporário no VPS
ssh $VPS_USER@$VPS_IP "mkdir -p /tmp/monitoring-scripts"

# Transferir scripts
scp setup-pm2-logs.sh $VPS_USER@$VPS_IP:/tmp/monitoring-scripts/
scp debug-system-freezes.sh $VPS_USER@$VPS_IP:/tmp/monitoring-scripts/
scp capture-user-loading-issues.sh $VPS_USER@$VPS_IP:/tmp/monitoring-scripts/

echo "✅ Arquivos transferidos!"

# Executar no VPS
ssh $VPS_USER@$VPS_IP << 'EOF'
cd /tmp/monitoring-scripts

echo "🔧 Executando setup do PM2..."
chmod +x setup-pm2-logs.sh
./setup-pm2-logs.sh

echo ""
echo "🐛 Configurando debug de travamentos..."
chmod +x debug-system-freezes.sh
./debug-system-freezes.sh

echo ""
echo "👤 Configurando captura de problemas de usuário..."
chmod +x capture-user-loading-issues.sh
./capture-user-loading-issues.sh

echo ""
echo "🎉 SISTEMA DE MONITORAMENTO INSTALADO!"
echo "======================================"

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Execute: /var/log/gestao-consert/debug/dashboard.sh"
echo "2. Para problemas de usuário: /var/log/gestao-consert/user-loading-debug/analyze-user-loading.sh monitor"
echo "3. Logs em tempo real: pm2 logs"

echo ""
echo "📁 LOGS PRINCIPAIS:"
echo "• /var/log/gestao-consert/combined.log"
echo "• /var/log/gestao-consert/timeouts.log"
echo "• /var/log/gestao-consert/user-loading-debug/user-issues.log"
EOF

echo ""
echo "🎯 MONITORAMENTO INSTALADO NO VPS!"
echo "=================================="

echo ""
echo "Para conectar e monitorar:"
echo "ssh root@$VPS_IP"
echo "/var/log/gestao-consert/debug/dashboard.sh"
