#!/bin/bash

echo "🔍 ANÁLISE AUTOMÁTICA DE LOGS - GESTÃO CONSERT"
echo "=============================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

LOG_DIR="/var/log/gestao-consert"
REPORT_FILE="$LOG_DIR/analysis-report-$(date '+%Y%m%d_%H%M%S').txt"

echo -e "${BLUE}📊 GERANDO RELATÓRIO DE ANÁLISE...${NC}"
echo "Relatório será salvo em: $REPORT_FILE"

# Criar relatório
cat > $REPORT_FILE << 'EOF'
🔍 RELATÓRIO DE ANÁLISE - GESTÃO CONSERT
========================================
Data: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo -e "\n${YELLOW}📋 1. STATUS DO SISTEMA PM2:${NC}"
echo "================================" | tee -a $REPORT_FILE
pm2 status | tee -a $REPORT_FILE

echo -e "\n${YELLOW}📊 2. ANÁLISE DE RECURSOS:${NC}"
echo "=========================" | tee -a $REPORT_FILE
echo "Uso de memória:" | tee -a $REPORT_FILE
free -h | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Uso de disco:" | tee -a $REPORT_FILE
df -h / | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Processos Node.js:" | tee -a $REPORT_FILE
ps aux | grep node | grep -v grep | tee -a $REPORT_FILE

echo -e "\n${YELLOW}🔍 3. ANÁLISE DE LOGS DO PM2:${NC}"
echo "=============================" | tee -a $REPORT_FILE

# Verificar se há logs de aplicação
if [ -d "/root/.pm2/logs" ]; then
    echo "Logs encontrados em /root/.pm2/logs:" | tee -a $REPORT_FILE
    ls -la /root/.pm2/logs/ | tee -a $REPORT_FILE
    
    echo -e "\n${BLUE}📝 Últimos 20 logs de erro:${NC}" | tee -a $REPORT_FILE
    find /root/.pm2/logs -name "*error*" -exec tail -20 {} \; | tee -a $REPORT_FILE
    
    echo -e "\n${BLUE}📝 Últimos 20 logs de saída:${NC}" | tee -a $REPORT_FILE
    find /root/.pm2/logs -name "*out*" -exec tail -20 {} \; | tee -a $REPORT_FILE
else
    echo "❌ Diretório de logs do PM2 não encontrado" | tee -a $REPORT_FILE
fi

echo -e "\n${YELLOW}🌐 4. ANÁLISE DE CONECTIVIDADE:${NC}"
echo "===============================" | tee -a $REPORT_FILE

# Verificar conectividade
echo "Teste de conectividade:" | tee -a $REPORT_FILE
if ping -c 3 8.8.8.8 &> /dev/null; then
    echo "✅ Internet: OK" | tee -a $REPORT_FILE
else
    echo "❌ Internet: FALHA" | tee -a $REPORT_FILE
fi

# Verificar porta 3000
echo "" | tee -a $REPORT_FILE
echo "Status da porta 3000:" | tee -a $REPORT_FILE
if netstat -tlnp | grep :3000; then
    echo "✅ Porta 3000: ATIVA" | tee -a $REPORT_FILE
else
    echo "❌ Porta 3000: INATIVA" | tee -a $REPORT_FILE
fi

# Verificar conexões ativas
echo "" | tee -a $REPORT_FILE
echo "Conexões ativas na porta 3000:" | tee -a $REPORT_FILE
netstat -an | grep :3000 | grep ESTABLISHED | wc -l | tee -a $REPORT_FILE

echo -e "\n${YELLOW}🔍 5. ANÁLISE DE LOGS ESPECÍFICOS:${NC}"
echo "=================================" | tee -a $REPORT_FILE

# Verificar logs de timeout
if [ -f "$LOG_DIR/timeouts.log" ]; then
    echo -e "\n${RED}⏰ TIMEOUTS DETECTADOS:${NC}" | tee -a $REPORT_FILE
    echo "Total de timeouts: $(wc -l < $LOG_DIR/timeouts.log)" | tee -a $REPORT_FILE
    echo "Últimos 10 timeouts:" | tee -a $REPORT_FILE
    tail -10 $LOG_DIR/timeouts.log | tee -a $REPORT_FILE
else
    echo "✅ Nenhum timeout registrado" | tee -a $REPORT_FILE
fi

# Verificar logs de erro
if [ -f "$LOG_DIR/errors.log" ]; then
    echo -e "\n${RED}❌ ERROS DETECTADOS:${NC}" | tee -a $REPORT_FILE
    echo "Total de erros: $(wc -l < $LOG_DIR/errors.log)" | tee -a $REPORT_FILE
    echo "Últimos 10 erros:" | tee -a $REPORT_FILE
    tail -10 $LOG_DIR/errors.log | tee -a $REPORT_FILE
else
    echo "✅ Nenhum erro registrado" | tee -a $REPORT_FILE
fi

# Verificar logs de carregamento
if [ -f "$LOG_DIR/loading.log" ]; then
    echo -e "\n${BLUE}⏳ EVENTOS DE CARREGAMENTO:${NC}" | tee -a $REPORT_FILE
    echo "Total de eventos: $(wc -l < $LOG_DIR/loading.log)" | tee -a $REPORT_FILE
    echo "Últimos 10 eventos:" | tee -a $REPORT_FILE
    tail -10 $LOG_DIR/loading.log | tee -a $REPORT_FILE
else
    echo "ℹ️ Nenhum evento de carregamento registrado" | tee -a $REPORT_FILE
fi

# Verificar logs de problemas de usuário
if [ -f "$LOG_DIR/user-loading-debug/user-issues.log" ]; then
    echo -e "\n${PURPLE}👤 PROBLEMAS DE USUÁRIO:${NC}" | tee -a $REPORT_FILE
    echo "Total de problemas: $(wc -l < $LOG_DIR/user-loading-debug/user-issues.log)" | tee -a $REPORT_FILE
    echo "Últimos 10 problemas:" | tee -a $REPORT_FILE
    tail -10 $LOG_DIR/user-loading-debug/user-issues.log | tee -a $REPORT_FILE
else
    echo "ℹ️ Nenhum problema de usuário registrado" | tee -a $REPORT_FILE
fi

echo -e "\n${YELLOW}🔍 6. ANÁLISE DE PADRÕES:${NC}"
echo "=======================" | tee -a $REPORT_FILE

# Analisar padrões de erro nos logs do PM2
if [ -d "/root/.pm2/logs" ]; then
    echo "Padrões de erro mais frequentes:" | tee -a $REPORT_FILE
    find /root/.pm2/logs -name "*error*" -exec grep -h "Error\|ERROR\|error" {} \; | \
    sort | uniq -c | sort -nr | head -10 | tee -a $REPORT_FILE
    
    echo "" | tee -a $REPORT_FILE
    echo "Padrões de timeout mais frequentes:" | tee -a $REPORT_FILE
    find /root/.pm2/logs -name "*error*" -exec grep -h "timeout\|TIMEOUT\|ECONNRESET\|ETIMEDOUT" {} \; | \
    sort | uniq -c | sort -nr | head -10 | tee -a $REPORT_FILE
fi

echo -e "\n${YELLOW}📋 7. RECOMENDAÇÕES:${NC}"
echo "===================" | tee -a $REPORT_FILE

# Gerar recomendações baseadas na análise
echo "Baseado na análise, aqui estão as recomendações:" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE

# Verificar uso de memória
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "🔴 ALTA: Uso de memória está em ${MEMORY_USAGE}% - considere reiniciar a aplicação" | tee -a $REPORT_FILE
fi

# Verificar uso de disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "🔴 ALTA: Uso de disco está em ${DISK_USAGE}% - limpe logs antigos" | tee -a $REPORT_FILE
fi

# Verificar se há muitos erros
if [ -f "$LOG_DIR/errors.log" ] && [ $(wc -l < $LOG_DIR/errors.log) -gt 50 ]; then
    echo "🔴 ALTA: Muitos erros detectados - verifique configuração do Supabase" | tee -a $REPORT_FILE
fi

# Verificar se há muitos timeouts
if [ -f "$LOG_DIR/timeouts.log" ] && [ $(wc -l < $LOG_DIR/timeouts.log) -gt 20 ]; then
    echo "🔴 ALTA: Muitos timeouts - verifique conectividade com Supabase" | tee -a $REPORT_FILE
fi

echo "" | tee -a $REPORT_FILE
echo "✅ Recomendações gerais:" | tee -a $REPORT_FILE
echo "• Monitore os logs regularmente" | tee -a $REPORT_FILE
echo "• Configure alertas para timeouts" | tee -a $REPORT_FILE
echo "• Verifique configurações do Supabase" | tee -a $REPORT_FILE
echo "• Considere aumentar timeout de requests" | tee -a $REPORT_FILE

echo -e "\n${GREEN}🎉 ANÁLISE CONCLUÍDA!${NC}"
echo -e "${BLUE}📄 Relatório salvo em: $REPORT_FILE${NC}"

echo -e "\n${YELLOW}📋 RESUMO RÁPIDO:${NC}"
echo "=================="
echo "• Status PM2: $(pm2 status | grep -c online) processos online"
echo "• Uso de memória: ${MEMORY_USAGE}%"
echo "• Uso de disco: ${DISK_USAGE}%"
if [ -f "$LOG_DIR/errors.log" ]; then
    echo "• Erros registrados: $(wc -l < $LOG_DIR/errors.log)"
fi
if [ -f "$LOG_DIR/timeouts.log" ]; then
    echo "• Timeouts registrados: $(wc -l < $LOG_DIR/timeouts.log)"
fi

echo -e "\n${BLUE}💡 Para ver o relatório completo:${NC}"
echo "cat $REPORT_FILE"
