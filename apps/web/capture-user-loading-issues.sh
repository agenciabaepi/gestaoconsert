#!/bin/bash

echo "👤 CAPTURA DE PROBLEMAS: 'Carregando dados do usuário...'"
echo "========================================================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_DIR="/var/log/gestao-consert"
USER_DEBUG_DIR="$LOG_DIR/user-loading-debug"
mkdir -p $USER_DEBUG_DIR

echo -e "${BLUE}🔍 CONFIGURANDO CAPTURA ESPECÍFICA...${NC}"

# Script para capturar problemas de carregamento de usuário
cat > $USER_DEBUG_DIR/capture-user-issues.js << 'EOF'
// Interceptador para problemas de carregamento de usuário
const fs = require('fs');
const path = require('path');

const LOG_FILE = '/var/log/gestao-consert/user-loading-debug/user-issues.log';

// Função para log com timestamp
function logIssue(type, message, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        message,
        details,
        stack: new Error().stack
    };
    
    const logLine = `[${timestamp}] ${type}: ${message}\n${JSON.stringify(details, null, 2)}\n---\n`;
    
    fs.appendFileSync(LOG_FILE, logLine);
    console.log(`🔍 USER DEBUG: ${type} - ${message}`);
}

// Interceptar consultas do Supabase relacionadas a usuário
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
    const message = args.join(' ');
    
    // Detectar padrões relacionados ao carregamento de usuário
    if (message.includes('Carregando dados') || 
        message.includes('fetchUserData') ||
        message.includes('usuarioData') ||
        message.includes('auth') ||
        message.includes('session')) {
        
        logIssue('INFO', 'User loading event detected', {
            message,
            timestamp: Date.now()
        });
    }
    
    originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
    const message = args.join(' ');
    
    // Capturar erros relacionados a usuário
    if (message.includes('usuário') ||
        message.includes('auth') ||
        message.includes('session') ||
        message.includes('supabase') ||
        message.includes('timeout') ||
        message.includes('ECONNRESET')) {
        
        logIssue('ERROR', 'User-related error detected', {
            message,
            args,
            timestamp: Date.now()
        });
    }
    
    originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('usuário') ||
        message.includes('auth') ||
        message.includes('session') ||
        message.includes('timeout')) {
        
        logIssue('WARNING', 'User-related warning detected', {
            message,
            args,
            timestamp: Date.now()
        });
    }
    
    originalConsoleWarn.apply(console, args);
};

// Interceptar requests HTTP relacionados a auth
const http = require('http');
const https = require('https');

const originalHttpRequest = http.request;
const originalHttpsRequest = https.request;

function interceptRequest(originalRequest, protocol) {
    return function(options, callback) {
        const url = typeof options === 'string' ? options : 
                   (options.protocol || protocol) + '//' + (options.hostname || options.host) + (options.path || '');
        
        // Detectar requests relacionados a auth/user
        if (url.includes('supabase') || 
            url.includes('auth') || 
            url.includes('user') ||
            url.includes('session')) {
            
            const startTime = Date.now();
            
            logIssue('REQUEST_START', 'Auth/User request started', {
                url,
                method: options.method || 'GET',
                startTime
            });
            
            const req = originalRequest.call(this, options, (res) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                logIssue('REQUEST_END', 'Auth/User request completed', {
                    url,
                    statusCode: res.statusCode,
                    duration,
                    headers: res.headers
                });
                
                if (callback) callback(res);
            });
            
            req.on('error', (error) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                logIssue('REQUEST_ERROR', 'Auth/User request failed', {
                    url,
                    error: error.message,
                    duration,
                    code: error.code
                });
            });
            
            req.on('timeout', () => {
                logIssue('REQUEST_TIMEOUT', 'Auth/User request timeout', {
                    url,
                    duration: Date.now() - startTime
                });
            });
            
            return req;
        }
        
        return originalRequest.call(this, options, callback);
    };
}

http.request = interceptRequest(originalHttpRequest, 'http:');
https.request = interceptRequest(originalHttpsRequest, 'https:');

console.log('🔍 User loading issue interceptor activated');
EOF

echo -e "${GREEN}✅ Interceptador JavaScript criado${NC}"

# Script para análise em tempo real
cat > $USER_DEBUG_DIR/analyze-user-loading.sh << 'EOF'
#!/bin/bash

LOG_DIR="/var/log/gestao-consert"
USER_LOG="$LOG_DIR/user-loading-debug/user-issues.log"

echo "👤 ANÁLISE DE PROBLEMAS: Carregando dados do usuário..."
echo "===================================================="

# Função para analisar padrões
analyze_patterns() {
    if [ ! -f "$USER_LOG" ]; then
        echo "❌ Log de usuário não encontrado: $USER_LOG"
        return 1
    fi
    
    echo "📊 ESTATÍSTICAS DOS ÚLTIMOS 30 MINUTOS:"
    echo "======================================="
    
    # Contar eventos por tipo
    echo "📈 Eventos por tipo:"
    grep -E "INFO|ERROR|WARNING|REQUEST_START|REQUEST_END|REQUEST_ERROR|REQUEST_TIMEOUT" "$USER_LOG" | \
    grep "$(date '+%Y-%m-%d %H:' -d '30 minutes ago')" | \
    cut -d']' -f2 | cut -d':' -f1 | sort | uniq -c | sort -nr
    
    echo ""
    echo "⏱️  Duração de requests (últimos 10):"
    grep "REQUEST_END" "$USER_LOG" | tail -10 | while read line; do
        duration=$(echo "$line" | grep -o '"duration":[0-9]*' | cut -d':' -f2)
        url=$(echo "$line" | grep -o '"url":"[^"]*' | cut -d'"' -f4)
        echo "  $duration ms - $url"
    done
    
    echo ""
    echo "🔴 Erros mais frequentes:"
    grep "ERROR" "$USER_LOG" | grep "$(date '+%Y-%m-%d')" | \
    grep -o '"message":"[^"]*' | cut -d'"' -f4 | sort | uniq -c | sort -nr | head -5
    
    echo ""
    echo "⏰ Timeouts detectados:"
    grep "TIMEOUT" "$USER_LOG" | grep "$(date '+%Y-%m-%d')" | wc -l
    
    echo ""
    echo "🔗 Problemas de conexão:"
    grep -E "ECONNRESET|ETIMEDOUT|ENOTFOUND" "$USER_LOG" | grep "$(date '+%Y-%m-%d')" | wc -l
}

# Função para monitoramento em tempo real
monitor_realtime() {
    echo "🔴 MONITORAMENTO EM TEMPO REAL (Ctrl+C para parar)"
    echo "================================================"
    
    tail -f "$USER_LOG" | while read line; do
        timestamp=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')
        
        if [[ "$line" =~ "ERROR" ]]; then
            echo "🔴 [$timestamp] ERRO DETECTADO!"
            echo "$line" | grep -o '"message":"[^"]*' | cut -d'"' -f4
            echo "---"
        elif [[ "$line" =~ "REQUEST_TIMEOUT" ]]; then
            echo "⏰ [$timestamp] TIMEOUT!"
            echo "$line" | grep -o '"url":"[^"]*' | cut -d'"' -f4
            echo "---"
        elif [[ "$line" =~ "REQUEST_ERROR" ]]; then
            echo "🔗 [$timestamp] ERRO DE CONEXÃO!"
            echo "$line" | grep -o '"error":"[^"]*' | cut -d'"' -f4
            echo "---"
        fi
    done
}

# Menu principal
case "${1:-analyze}" in
    "analyze")
        analyze_patterns
        ;;
    "monitor")
        monitor_realtime
        ;;
    "both")
        analyze_patterns
        echo ""
        echo "Iniciando monitoramento em tempo real..."
        sleep 2
        monitor_realtime
        ;;
    *)
        echo "Uso: $0 [analyze|monitor|both]"
        echo "  analyze - Análise de padrões (padrão)"
        echo "  monitor - Monitoramento em tempo real"
        echo "  both    - Análise + monitoramento"
        ;;
esac
EOF

chmod +x $USER_DEBUG_DIR/analyze-user-loading.sh

# Script para injetar o interceptador na aplicação
cat > $USER_DEBUG_DIR/inject-interceptor.sh << 'EOF'
#!/bin/bash

echo "💉 INJETANDO INTERCEPTADOR DE USUÁRIO..."

# Encontrar o arquivo principal da aplicação
APP_DIRS=(
    "/opt/gestaoConsert"
    "/opt/gestao-consert" 
    "/var/www/gestaoConsert"
    "/var/www/gestao-consert"
    "/root/gestaoConsert"
)

PROJECT_DIR=""
for dir in "${APP_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        PROJECT_DIR="$dir"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Projeto não encontrado"
    exit 1
fi

echo "✅ Projeto encontrado em: $PROJECT_DIR"

# Criar arquivo de inicialização com interceptador
cat > "$PROJECT_DIR/debug-interceptor.js" << 'EOJS'
// Carregar interceptador antes de qualquer outra coisa
require('/var/log/gestao-consert/user-loading-debug/capture-user-issues.js');

// Carregar aplicação principal
require('./server.js');
EOJS

# Atualizar configuração do PM2 para usar o interceptador
cat > "$PROJECT_DIR/ecosystem.debug-user.config.js" << 'EOJS'
module.exports = {
  apps: [{
    name: 'gestao-consert-user-debug',
    script: 'debug-interceptor.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    
    out_file: '/var/log/gestao-consert/user-loading-debug/out.log',
    error_file: '/var/log/gestao-consert/user-loading-debug/error.log',
    log_file: '/var/log/gestao-consert/user-loading-debug/combined.log',
    time: true,
    
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      USER_DEBUG: 'true'
    },
    
    max_memory_restart: '800M',
    min_uptime: '5s',
    max_restarts: 10,
    
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z'
  }]
}
EOJS

echo "✅ Interceptador configurado!"
echo ""
echo "Para ativar:"
echo "1. cd $PROJECT_DIR"
echo "2. pm2 delete all"
echo "3. pm2 start ecosystem.debug-user.config.js"
echo "4. pm2 save"
EOF

chmod +x $USER_DEBUG_DIR/inject-interceptor.sh

echo -e "${GREEN}✅ Scripts de captura criados${NC}"

echo -e "\n${PURPLE}🎯 SISTEMA DE CAPTURA ESPECÍFICO CONFIGURADO!${NC}"

echo -e "\n${BLUE}🚀 COMO INVESTIGAR O PROBLEMA 'Carregando dados do usuário...':${NC}"
echo ""
echo -e "${YELLOW}1. Injetar interceptador:${NC}"
echo -e "   $USER_DEBUG_DIR/inject-interceptor.sh"
echo ""
echo -e "${YELLOW}2. Análise de padrões:${NC}"
echo -e "   $USER_DEBUG_DIR/analyze-user-loading.sh analyze"
echo ""
echo -e "${YELLOW}3. Monitoramento em tempo real:${NC}"
echo -e "   $USER_DEBUG_DIR/analyze-user-loading.sh monitor"
echo ""
echo -e "${YELLOW}4. Análise completa:${NC}"
echo -e "   $USER_DEBUG_DIR/analyze-user-loading.sh both"

echo -e "\n${BLUE}📊 LOGS ESPECÍFICOS:${NC}"
echo -e "${GREEN}• Problemas de usuário:${NC} tail -f $USER_DEBUG_DIR/user-issues.log"
echo -e "${GREEN}• Logs da aplicação:${NC} tail -f $USER_DEBUG_DIR/combined.log"
echo -e "${GREEN}• Apenas erros:${NC} tail -f $USER_DEBUG_DIR/error.log"

echo -e "\n${RED}🎯 ESTE SISTEMA VAI CAPTURAR:${NC}"
echo -e "• ⏳ Todos os eventos de 'Carregando dados'"
echo -e "• 🔗 Requests para Supabase/Auth"
echo -e "• ⏰ Timeouts de conexão"
echo -e "• 🔴 Erros ECONNRESET"
echo -e "• 📊 Duração de requests"
echo -e "• 🚨 Padrões de falha"

echo -e "\n${PURPLE}💡 Execute os scripts no VPS para começar a investigação!${NC}"
