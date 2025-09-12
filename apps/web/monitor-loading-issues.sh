#!/bin/bash

echo "🔍 MONITORAMENTO DE PROBLEMAS DE CARREGAMENTO"
echo "============================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_FILE="/var/log/gestao-consert/loading-monitor-$(date '+%Y%m%d_%H%M%S').log"

echo -e "${BLUE}📊 Iniciando monitoramento em tempo real...${NC}"
echo "Log será salvo em: $LOG_FILE"

# Função para log
log_event() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Monitorar logs do Docker em tempo real
log_event "🔍 Iniciando monitoramento de logs da aplicação"

# Verificar se há requests travados
check_stuck_requests() {
    echo -e "\n${YELLOW}📊 VERIFICANDO REQUESTS TRAVADOS:${NC}"
    
    # Verificar conexões ativas
    CONNECTIONS=$(netstat -an | grep :3000 | grep ESTABLISHED | wc -l)
    log_event "Conexões ativas na porta 3000: $CONNECTIONS"
    
    # Verificar processos Node.js
    NODE_PROCESSES=$(ps aux | grep node | grep -v grep | wc -l)
    log_event "Processos Node.js ativos: $NODE_PROCESSES"
    
    # Verificar uso de memória
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    log_event "Uso de memória: ${MEMORY_USAGE}%"
    
    if [ $MEMORY_USAGE -gt 80 ]; then
        log_event "⚠️ ALTA: Uso de memória crítico!"
    fi
}

# Monitorar logs do container
monitor_container_logs() {
    echo -e "\n${BLUE}📝 MONITORANDO LOGS DO CONTAINER:${NC}"
    
    # Capturar logs recentes
    docker logs gestaoconsert-app-1 --tail 20 | while read line; do
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"timeout"* ]] || [[ $line == *"ECONNRESET"* ]]; then
            log_event "🚨 ERRO DETECTADO: $line"
        elif [[ $line == *"Carregando"* ]] || [[ $line == *"Loading"* ]]; then
            log_event "⏳ CARREGAMENTO: $line"
        fi
    done
}

# Verificar conectividade com Supabase
check_supabase_connectivity() {
    echo -e "\n${GREEN}🌐 VERIFICANDO CONECTIVIDADE SUPABASE:${NC}"
    
    # Testar conectividade
    if curl -s --max-time 10 https://nxamrvfusyrtkcshehfm.supabase.co > /dev/null; then
        log_event "✅ Supabase: Conectividade OK"
    else
        log_event "❌ Supabase: Problema de conectividade"
    fi
    
    # Verificar DNS
    if nslookup nxamrvfusyrtkcshehfm.supabase.co > /dev/null 2>&1; then
        log_event "✅ DNS: Resolução OK"
    else
        log_event "❌ DNS: Problema de resolução"
    fi
}

# Monitorar em loop
echo -e "${BLUE}🔄 Iniciando loop de monitoramento...${NC}"
echo "Pressione Ctrl+C para parar"

while true; do
    echo -e "\n${YELLOW}=== $(date '+%H:%M:%S') ===${NC}"
    
    check_stuck_requests
    check_supabase_connectivity
    
    # Verificar se há processos travados
    STUCK_PROCESSES=$(ps aux | grep node | grep -v grep | awk '{if($3 > 50) print $2 " " $3 "%"}')
    if [ ! -z "$STUCK_PROCESSES" ]; then
        log_event "⚠️ PROCESSOS COM ALTO CPU: $STUCK_PROCESSES"
    fi
    
    sleep 5
done
