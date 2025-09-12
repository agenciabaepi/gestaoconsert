#!/bin/bash

echo "🔍 SISTEMA DE DIAGNÓSTICO - TRAVAMENTOS E TIMEOUTS"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

LOG_DIR="/var/log/gestao-consert"
DEBUG_DIR="$LOG_DIR/debug"
mkdir -p $DEBUG_DIR

echo -e "${BLUE}📊 1. CONFIGURANDO MONITORAMENTO AVANÇADO...${NC}"

# Criar script de monitoramento em tempo real
cat > $DEBUG_DIR/monitor-realtime.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

echo "🚀 INICIANDO MONITORAMENTO EM TEMPO REAL - $TIMESTAMP"
echo "======================================================"

# Função para log com timestamp
log_with_time() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Monitorar logs de aplicação
monitor_app_logs() {
    echo "📱 LOGS DA APLICAÇÃO:"
    echo "===================="
    
    # Seguir logs do PM2
    pm2 logs --lines 50 --raw --timestamp | while read line; do
        # Detectar padrões problemáticos
        if [[ "$line" =~ "timeout" ]] || [[ "$line" =~ "ECONNRESET" ]] || [[ "$line" =~ "ETIMEDOUT" ]]; then
            log_with_time "🔴 TIMEOUT DETECTADO: $line" | tee -a $LOG_DIR/timeouts.log
        elif [[ "$line" =~ "Error" ]] || [[ "$line" =~ "ERROR" ]]; then
            log_with_time "❌ ERRO: $line" | tee -a $LOG_DIR/errors.log
        elif [[ "$line" =~ "Carregando dados" ]] || [[ "$line" =~ "loading" ]]; then
            log_with_time "⏳ CARREGAMENTO: $line" | tee -a $LOG_DIR/loading.log
        else
            log_with_time "$line"
        fi
    done
}

# Executar monitoramento
monitor_app_logs
EOF

chmod +x $DEBUG_DIR/monitor-realtime.sh

echo -e "${GREEN}✅ Monitor em tempo real configurado${NC}"

echo -e "\n${BLUE}🔧 2. CONFIGURANDO LOGS ESTRUTURADOS...${NC}"

# Criar configuração PM2 com logs detalhados
cat > ecosystem.debug.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gestao-consert-debug',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    
    // Logs super detalhados
    out_file: '/var/log/gestao-consert/debug/out.log',
    error_file: '/var/log/gestao-consert/debug/error.log',
    log_file: '/var/log/gestao-consert/debug/combined.log',
    time: true,
    
    // Variáveis de ambiente para debug
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DEBUG: '*',
      VERBOSE: 'true',
      LOG_LEVEL: 'debug'
    },
    
    // Configurações específicas para detectar travamentos
    max_memory_restart: '800M',
    min_uptime: '5s',
    max_restarts: 20,
    
    // Logs com timestamp detalhado
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
    
    // Configurações de restart para capturar problemas
    restart_delay: 2000,
    
    // Monitoramento de CPU e memória
    monitoring: true
  }]
}
EOF

echo -e "${GREEN}✅ Configuração debug criada${NC}"

echo -e "\n${BLUE}📈 3. CRIANDO SCRIPTS DE ANÁLISE...${NC}"

# Script para analisar padrões de travamento
cat > $DEBUG_DIR/analyze-freezes.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"
REPORT_FILE="$LOG_DIR/freeze-analysis-$(date '+%Y%m%d_%H%M%S').txt"

echo "🔍 ANÁLISE DE TRAVAMENTOS - $(date)" > $REPORT_FILE
echo "=======================================" >> $REPORT_FILE

# Analisar logs de timeout
echo -e "\n📊 ANÁLISE DE TIMEOUTS:" >> $REPORT_FILE
if [ -f "$LOG_DIR/timeouts.log" ]; then
    echo "Total de timeouts: $(wc -l < $LOG_DIR/timeouts.log)" >> $REPORT_FILE
    echo -e "\nÚltimos 10 timeouts:" >> $REPORT_FILE
    tail -10 $LOG_DIR/timeouts.log >> $REPORT_FILE
else
    echo "Nenhum timeout registrado ainda." >> $REPORT_FILE
fi

# Analisar padrões de carregamento
echo -e "\n⏳ ANÁLISE DE CARREGAMENTOS:" >> $REPORT_FILE
if [ -f "$LOG_DIR/loading.log" ]; then
    echo "Total de eventos de carregamento: $(wc -l < $LOG_DIR/loading.log)" >> $REPORT_FILE
    echo -e "\nPadrões mais frequentes:" >> $REPORT_FILE
    grep -o "Carregando [^-]*" $LOG_DIR/loading.log | sort | uniq -c | sort -nr | head -5 >> $REPORT_FILE
else
    echo "Nenhum evento de carregamento registrado ainda." >> $REPORT_FILE
fi

# Analisar uso de recursos
echo -e "\n💾 ANÁLISE DE RECURSOS:" >> $REPORT_FILE
echo "Uso atual de memória:" >> $REPORT_FILE
free -h >> $REPORT_FILE
echo -e "\nProcessos Node.js:" >> $REPORT_FILE
ps aux | grep node >> $REPORT_FILE

# Status do PM2
echo -e "\n🔧 STATUS PM2:" >> $REPORT_FILE
pm2 status >> $REPORT_FILE

echo "Relatório salvo em: $REPORT_FILE"
cat $REPORT_FILE
EOF

chmod +x $DEBUG_DIR/analyze-freezes.sh

# Script para monitoramento de rede
cat > $DEBUG_DIR/monitor-network.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"
NETWORK_LOG="$LOG_DIR/network-$(date '+%Y%m%d').log"

echo "🌐 MONITORAMENTO DE REDE - $(date)" | tee -a $NETWORK_LOG

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Verificar conectividade
    if ping -c 1 8.8.8.8 &> /dev/null; then
        echo "[$TIMESTAMP] ✅ Internet: OK" | tee -a $NETWORK_LOG
    else
        echo "[$TIMESTAMP] ❌ Internet: FALHA" | tee -a $NETWORK_LOG
    fi
    
    # Verificar conexões ativas
    CONNECTIONS=$(netstat -an | grep :3000 | wc -l)
    echo "[$TIMESTAMP] 🔗 Conexões ativas na porta 3000: $CONNECTIONS" | tee -a $NETWORK_LOG
    
    # Verificar uso de portas
    if netstat -tlnp | grep :3000 &> /dev/null; then
        echo "[$TIMESTAMP] ✅ Porta 3000: ATIVA" | tee -a $NETWORK_LOG
    else
        echo "[$TIMESTAMP] ❌ Porta 3000: INATIVA" | tee -a $NETWORK_LOG
    fi
    
    sleep 30
done
EOF

chmod +x $DEBUG_DIR/monitor-network.sh

echo -e "${GREEN}✅ Scripts de análise criados${NC}"

echo -e "\n${BLUE}🚨 4. CONFIGURANDO ALERTAS AUTOMÁTICOS...${NC}"

# Script de alertas
cat > $DEBUG_DIR/alert-system.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"
ALERT_LOG="$LOG_DIR/alerts.log"

# Função para enviar alerta
send_alert() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] 🚨 ALERTA: $message" | tee -a $ALERT_LOG
}

# Monitorar logs em tempo real para detectar problemas
tail -F $LOG_DIR/combined.log | while read line; do
    # Detectar padrões problemáticos
    if [[ "$line" =~ "ECONNRESET" ]]; then
        send_alert "Conexão resetada detectada: $line"
    elif [[ "$line" =~ "timeout" ]]; then
        send_alert "Timeout detectado: $line"
    elif [[ "$line" =~ "Error.*loading" ]]; then
        send_alert "Erro de carregamento: $line"
    elif [[ "$line" =~ "Cannot connect" ]]; then
        send_alert "Falha de conexão: $line"
    elif [[ "$line" =~ "504" ]] || [[ "$line" =~ "502" ]]; then
        send_alert "Erro de gateway: $line"
    fi
done &
EOF

chmod +x $DEBUG_DIR/alert-system.sh

echo -e "${GREEN}✅ Sistema de alertas configurado${NC}"

echo -e "\n${BLUE}📱 5. CRIANDO DASHBOARD DE MONITORAMENTO...${NC}"

# Script do dashboard
cat > $DEBUG_DIR/dashboard.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"

# Função para mostrar dashboard
show_dashboard() {
    clear
    echo "🖥️  DASHBOARD DE MONITORAMENTO - GESTÃO CONSERT"
    echo "=============================================="
    echo "Atualizado em: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Status do PM2
    echo "🔧 STATUS PM2:"
    pm2 jlist | jq -r '.[] | "  \(.name): \(.pm2_env.status) (CPU: \(.monit.cpu)%, RAM: \(.monit.memory/1024/1024 | floor)MB)"' 2>/dev/null || pm2 status
    echo ""
    
    # Recursos do sistema
    echo "💾 RECURSOS DO SISTEMA:"
    echo "  $(free -h | grep Mem: | awk '{print "RAM: " $3 "/" $2 " (" $3/$2*100 "% usado)"}')"
    echo "  $(df -h / | tail -1 | awk '{print "Disco: " $3 "/" $2 " (" $5 " usado)"}')"
    echo ""
    
    # Estatísticas de logs
    echo "📊 ESTATÍSTICAS DOS ÚLTIMOS 10 MINUTOS:"
    if [ -f "$LOG_DIR/timeouts.log" ]; then
        TIMEOUTS=$(tail -100 $LOG_DIR/timeouts.log | grep "$(date '+%Y-%m-%d %H:')" | wc -l)
        echo "  🔴 Timeouts: $TIMEOUTS"
    fi
    
    if [ -f "$LOG_DIR/errors.log" ]; then
        ERRORS=$(tail -100 $LOG_DIR/errors.log | grep "$(date '+%Y-%m-%d %H:')" | wc -l)
        echo "  ❌ Erros: $ERRORS"
    fi
    
    # Conexões ativas
    CONNECTIONS=$(netstat -an | grep :3000 | grep ESTABLISHED | wc -l)
    echo "  🔗 Conexões ativas: $CONNECTIONS"
    
    echo ""
    echo "📝 ÚLTIMAS ATIVIDADES:"
    if [ -f "$LOG_DIR/combined.log" ]; then
        tail -5 $LOG_DIR/combined.log | while read line; do
            echo "  $line"
        done
    fi
    
    echo ""
    echo "⌨️  COMANDOS:"
    echo "  [R] Refresh  [L] Ver logs  [A] Análise  [Q] Sair"
}

# Loop do dashboard
while true; do
    show_dashboard
    
    read -t 5 -n 1 key
    case $key in
        r|R) continue ;;
        l|L) pm2 logs --lines 20 ;;
        a|A) $LOG_DIR/debug/analyze-freezes.sh ;;
        q|Q) break ;;
    esac
done
EOF

chmod +x $DEBUG_DIR/dashboard.sh

echo -e "${GREEN}✅ Dashboard criado${NC}"

echo -e "\n${PURPLE}🎉 CONFIGURAÇÃO COMPLETA!${NC}"
echo -e "${YELLOW}📁 Todos os arquivos criados em: $DEBUG_DIR${NC}"

echo -e "\n${BLUE}🚀 COMANDOS PARA INVESTIGAR TRAVAMENTOS:${NC}"
echo -e "${GREEN}• Monitoramento em tempo real:${NC} $DEBUG_DIR/monitor-realtime.sh"
echo -e "${GREEN}• Dashboard interativo:${NC} $DEBUG_DIR/dashboard.sh"
echo -e "${GREEN}• Análise de travamentos:${NC} $DEBUG_DIR/analyze-freezes.sh"
echo -e "${GREEN}• Monitor de rede:${NC} $DEBUG_DIR/monitor-network.sh &"
echo -e "${GREEN}• Sistema de alertas:${NC} $DEBUG_DIR/alert-system.sh &"

echo -e "\n${BLUE}📊 LOGS ESPECIALIZADOS:${NC}"
echo -e "${YELLOW}• Timeouts:${NC} tail -f $LOG_DIR/timeouts.log"
echo -e "${YELLOW}• Erros:${NC} tail -f $LOG_DIR/errors.log"
echo -e "${YELLOW}• Carregamentos:${NC} tail -f $LOG_DIR/loading.log"
echo -e "${YELLOW}• Alertas:${NC} tail -f $LOG_DIR/alerts.log"

echo -e "\n${PURPLE}💡 DICA: Execute o dashboard para uma visão completa!${NC}"
echo -e "${BLUE}$DEBUG_DIR/dashboard.sh${NC}"
