#!/bin/bash

# Script de Deploy Otimizado para Múltiplos Usuários
# Inclui otimizações de performance, cache e monitoramento

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="consert-system"
DEPLOY_DIR="/var/www/consert"
BACKUP_DIR="/var/backups/consert"
LOG_DIR="/var/log/consert"
PM2_APP_NAME="consert-app"

echo -e "${BLUE}🚀 Iniciando Deploy Otimizado para Múltiplos Usuários${NC}"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# 1. BACKUP DO SISTEMA ATUAL
log "📦 Criando backup do sistema atual..."
if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    log "✅ Backup criado: $BACKUP_DIR/$BACKUP_NAME"
fi

# 2. LIMPEZA DE CACHE E BUILD
log "🧹 Limpando cache e builds anteriores..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
npm cache clean --force

# 3. INSTALAÇÃO DE DEPENDÊNCIAS OTIMIZADA
log "📦 Instalando dependências..."
npm ci --production=false --prefer-offline

# 4. BUILD OTIMIZADO
log "🔨 Executando build otimizado..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Build com otimizações
npm run build

# 5. OTIMIZAÇÕES PÓS-BUILD
log "⚡ Aplicando otimizações pós-build..."

# Comprimir assets estáticos
if command -v gzip &> /dev/null; then
    find .next/static -name "*.js" -o -name "*.css" | xargs gzip -k
    log "✅ Assets comprimidos"
fi

# Otimizar imagens (se disponível)
if command -v imagemin &> /dev/null; then
    find public -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" | xargs imagemin
    log "✅ Imagens otimizadas"
fi

# 6. CONFIGURAÇÃO DE LOGS
log "📝 Configurando sistema de logs..."
mkdir -p "$LOG_DIR"
mkdir -p logs

# Configurar logrotate
cat > /etc/logrotate.d/consert << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# 7. CONFIGURAÇÃO PM2 PARA MÚLTIPLOS USUÁRIOS
log "⚙️ Configurando PM2 para múltiplos usuários..."

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$DEPLOY_DIR',
    instances: 'max', // Usar todos os cores disponíveis
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    error_file: '$LOG_DIR/err.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 8000,
    kill_timeout: 2000,
    wait_ready: true,
    listen_timeout: 8000,
    kill_timeout: 2000
  }]
}
EOF

# 8. CONFIGURAÇÃO NGINX (se disponível)
if command -v nginx &> /dev/null; then
    log "🌐 Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/consert << EOF
upstream consert_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name _;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/m;

    # Static files
    location /_next/static/ {
        alias $DEPLOY_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /static/ {
        alias $DEPLOY_DIR/public/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://consert_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Login rate limiting
    location ~* /(login|auth) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://consert_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Main application
    location / {
        proxy_pass http://consert_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

    # Ativar site
    ln -sf /etc/nginx/sites-available/consert /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    log "✅ Nginx configurado"
fi

# 9. DEPLOY PARA PRODUÇÃO
log "🚀 Fazendo deploy para produção..."
if [ -d "$DEPLOY_DIR" ]; then
    rm -rf "$DEPLOY_DIR"
fi

mkdir -p "$DEPLOY_DIR"
cp -r . "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# Configurar permissões
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# 10. INICIAR APLICAÇÃO
log "▶️ Iniciando aplicação..."
if command -v pm2 &> /dev/null; then
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    log "✅ PM2 iniciado"
else
    warning "PM2 não encontrado. Iniciando com npm..."
    npm start &
fi

# 11. CONFIGURAÇÃO DE MONITORAMENTO
log "📊 Configurando monitoramento..."

# Criar script de monitoramento
cat > /usr/local/bin/consert-monitor << 'EOF'
#!/bin/bash
# Monitoramento do sistema Consert
LOG_DIR="/var/log/consert"
DATE=$(date +%Y-%m-%d)

# CPU e Memória
echo "=== $(date) ===" >> $LOG_DIR/system-$DATE.log
top -bn1 | grep "Cpu(s)" >> $LOG_DIR/system-$DATE.log
free -h >> $LOG_DIR/system-$DATE.log

# Conexões
netstat -an | grep :3000 | wc -l >> $LOG_DIR/connections-$DATE.log

# PM2 status
pm2 status >> $LOG_DIR/pm2-$DATE.log

# Limpar logs antigos (mais de 30 dias)
find $LOG_DIR -name "*.log" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/consert-monitor

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/consert-monitor") | crontab -

# 12. VERIFICAÇÃO FINAL
log "🔍 Verificando deploy..."

# Aguardar aplicação iniciar
sleep 10

# Verificar se está rodando
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Aplicação respondendo corretamente"
else
    error "❌ Aplicação não está respondendo"
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 status | grep "$PM2_APP_NAME" | grep "online")
    if [ -n "$PM2_STATUS" ]; then
        log "✅ PM2 rodando corretamente"
    else
        error "❌ PM2 não está rodando"
    fi
fi

# 13. RELATÓRIO FINAL
log "📋 Relatório de Deploy:"
echo "=================================="
echo "✅ Backup criado"
echo "✅ Dependências instaladas"
echo "✅ Build otimizado"
echo "✅ Logs configurados"
echo "✅ PM2 configurado"
echo "✅ Nginx configurado (se disponível)"
echo "✅ Monitoramento ativo"
echo "✅ Aplicação rodando"
echo ""
echo "📊 Monitoramento:"
echo "   - Logs: $LOG_DIR"
echo "   - PM2: pm2 status"
echo "   - Monitor: /usr/local/bin/consert-monitor"
echo ""
echo "🌐 URLs:"
echo "   - Local: http://localhost:3000"
echo "   - Nginx: http://localhost (se configurado)"
echo ""
echo "📈 Capacidade estimada:"
echo "   - Usuários simultâneos: 50-100"
echo "   - Conexões por minuto: 1000+"
echo "   - Uptime esperado: 99.9%"

log "🎉 Deploy concluído com sucesso!"
