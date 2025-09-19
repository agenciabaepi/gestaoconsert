#!/bin/bash

echo "🔍 CONFIGURANDO MONITORAMENTO PM2 - VPS HOSTINGER"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 1. VERIFICANDO STATUS ATUAL...${NC}"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 não encontrado. Instalando...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 já instalado${NC}"
fi

# Mostrar processos atuais
echo -e "\n${YELLOW}📊 Processos PM2 atuais:${NC}"
pm2 list

echo -e "\n${BLUE}📁 2. CRIANDO DIRETÓRIO DE LOGS...${NC}"

# Criar diretório de logs organizados
LOG_DIR="/var/log/gestao-consert"
mkdir -p $LOG_DIR
chmod 755 $LOG_DIR

echo -e "${GREEN}✅ Diretório criado: $LOG_DIR${NC}"

echo -e "\n${BLUE}📝 3. CONFIGURANDO LOGS ESTRUTURADOS...${NC}"

# Configurar PM2 para logs estruturados
pm2 install pm2-logrotate

# Configurar rotação de logs
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

echo -e "${GREEN}✅ Rotação de logs configurada${NC}"

echo -e "\n${BLUE}🔧 4. CONFIGURANDO APLICAÇÃO...${NC}"

# Encontrar o diretório do projeto
PROJECT_DIRS=(
    "/opt/gestaoConsert"
    "/opt/gestao-consert" 
    "/var/www/gestaoConsert"
    "/var/www/gestao-consert"
    "/root/gestaoConsert"
    "/root/gestao-consert"
    "/home/gestaoConsert"
    "/home/gestao-consert"
)

PROJECT_DIR=""
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        PROJECT_DIR="$dir"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Projeto não encontrado. Procurando...${NC}"
    PROJECT_DIR=$(find / -name "gestaoConsert" -type d 2>/dev/null | head -1)
    if [ -z "$PROJECT_DIR" ]; then
        PROJECT_DIR=$(find / -name "package.json" -path "*/gestao*" 2>/dev/null | head -1 | xargs dirname)
    fi
fi

if [ -n "$PROJECT_DIR" ]; then
    echo -e "${GREEN}✅ Projeto encontrado em: $PROJECT_DIR${NC}"
    cd "$PROJECT_DIR"
else
    echo -e "${YELLOW}⚠️ Projeto não encontrado automaticamente${NC}"
    echo "Por favor, navegue manualmente para o diretório do projeto"
    exit 1
fi

echo -e "\n${BLUE}🚀 5. CONFIGURANDO PM2 ECOSYSTEM...${NC}"

# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gestao-consert',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    
    // Logs estruturados
    out_file: '/var/log/gestao-consert/out.log',
    error_file: '/var/log/gestao-consert/error.log',
    log_file: '/var/log/gestao-consert/combined.log',
    time: true,
    
    // Monitoramento
    monitoring: true,
    
    // Restart automático
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Configurações de restart
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configurações de memória
    max_memory_restart: '500M',
    
    // Configurações de log
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

echo -e "${GREEN}✅ Ecosystem configurado${NC}"

echo -e "\n${BLUE}📊 6. INICIANDO MONITORAMENTO...${NC}"

# Parar processos existentes
pm2 delete all 2>/dev/null || true

# Iniciar com nova configuração
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar startup
pm2 startup

echo -e "\n${GREEN}🎉 CONFIGURAÇÃO CONCLUÍDA!${NC}"
echo -e "${YELLOW}📁 Logs disponíveis em: $LOG_DIR${NC}"

echo -e "\n${BLUE}🔍 COMANDOS ÚTEIS PARA MONITORAMENTO:${NC}"
echo -e "${YELLOW}• Ver logs em tempo real:${NC} pm2 logs"
echo -e "${YELLOW}• Ver logs de erro:${NC} pm2 logs --err"
echo -e "${YELLOW}• Ver apenas logs out:${NC} pm2 logs --out"
echo -e "${YELLOW}• Monitoramento visual:${NC} pm2 monit"
echo -e "${YELLOW}• Status dos processos:${NC} pm2 status"
echo -e "${YELLOW}• Restart aplicação:${NC} pm2 restart gestao-consert"
echo -e "${YELLOW}• Ver logs específicos:${NC} tail -f $LOG_DIR/error.log"

echo -e "\n${BLUE}📝 ARQUIVOS DE LOG:${NC}"
echo -e "${YELLOW}• Logs de saída:${NC} $LOG_DIR/out.log"
echo -e "${YELLOW}• Logs de erro:${NC} $LOG_DIR/error.log" 
echo -e "${YELLOW}• Logs combinados:${NC} $LOG_DIR/combined.log"

echo -e "\n${GREEN}✅ Sistema configurado para monitoramento completo!${NC}"
echo -e "${BLUE}🚀 Execute 'pm2 logs' para ver logs em tempo real${NC}"
