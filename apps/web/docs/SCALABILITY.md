# 📈 Guia de Escalabilidade - Sistema Consert

## 🎯 Visão Geral

Este documento descreve as otimizações implementadas para suportar múltiplos usuários simultâneos no sistema Consert, garantindo performance, estabilidade e segurança.

## 🚀 Capacidade Estimada

| Métrica | Capacidade Atual | Limite Recomendado | Ação Necessária |
|---------|------------------|-------------------|-----------------|
| **Usuários Simultâneos** | 50-100 | 200+ | Load Balancing |
| **Requisições/min** | 1000+ | 5000+ | Cache Redis |
| **Conexões Supabase** | 100+ | 500+ | Connection Pool |
| **Uploads/min** | 50+ | 200+ | CDN |
| **Uptime** | 99.9% | 99.99% | Failover |

## ⚡ Otimizações Implementadas

### 1. **Next.js Otimizado**

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js'],
    turbo: { /* otimizações */ }
  },
  
  // Cache estratégico
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300' }
        ]
      }
    ]
  }
}
```

### 2. **Rate Limiting**

```typescript
// src/middleware/rateLimit.ts
const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requisições por IP
});

const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5, // 5 tentativas de login
});
```

### 3. **Hooks de Performance**

```typescript
// src/hooks/usePerformance.ts
export function useOptimizedQuery() {
  const { debounce, throttle, getCached, setCached, withRetry } = usePerformance();
  
  return { optimizedQuery };
}
```

### 4. **Monitoramento em Tempo Real**

```bash
# Iniciar monitoramento
npm run monitor

# Monitoramento em desenvolvimento (10s)
npm run monitor:dev
```

## 🔧 Configurações de Produção

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'consert-app',
    script: 'npm',
    args: 'start',
    instances: 'max', // Usar todos os cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Nginx com Rate Limiting

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;

# API endpoints
location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://consert_backend;
}
```

## 📊 Monitoramento

### Métricas Monitoradas

1. **CPU Usage** - Limite: 80%
2. **Memory Usage** - Limite: 80%
3. **Active Connections** - Limite: 100
4. **Response Time** - Limite: 2s
5. **Error Rate** - Limite: 5%

### Alertas Automáticos

```bash
# Alertas críticos
if (cpu > 90) console.log("🚨 CPU muito alta");
if (memory > 90) console.log("🚨 Memória muito alta");
if (connections > 100) console.log("🚨 Muitas conexões");
```

## 🛡️ Segurança

### Isolamento de Dados

```typescript
// Todas as queries filtram por empresa
.eq('empresa_id', empresaId)

// Validação obrigatória
if (!usuarioData?.empresa_id) {
  addToast('error', 'Empresa não identificada');
  return;
}
```

### Rate Limiting por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/auth/*` | 5 req | 15 min |
| `/api/upload` | 10 req | 1 hora |
| `/api/*` | 100 req | 15 min |

## 🔄 Deploy Otimizado

### Script Automatizado

```bash
# Deploy completo
npm run deploy

# Deploy staging
npm run deploy:staging

# Teste de performance
npm run test:performance
```

### Processo de Deploy

1. **Backup** do sistema atual
2. **Limpeza** de cache e builds
3. **Build** otimizado
4. **Configuração** PM2/Nginx
5. **Monitoramento** automático
6. **Verificação** de saúde

## 📈 Escalabilidade Horizontal

### Load Balancing

```nginx
upstream consert_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    keepalive 32;
}
```

### Cache Distribuído

```typescript
// Redis para cache compartilhado
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Timeout de Conexão**
   ```bash
   # Verificar conexões
   netstat -an | grep :3000 | wc -l
   ```

2. **Alto Uso de CPU**
   ```bash
   # Monitorar processos
   top -p $(pgrep -f "next")
   ```

3. **Erro de Memória**
   ```bash
   # Verificar uso de memória
   free -h && pm2 status
   ```

### Logs Importantes

```bash
# Logs do sistema
tail -f /var/log/consert/system-*.log

# Logs do PM2
pm2 logs consert-app

# Logs do Nginx
tail -f /var/log/nginx/access.log
```

## 📋 Checklist de Deploy

- [ ] **Backup** do sistema atual
- [ ] **Teste** de performance local
- [ ] **Monitoramento** ativo
- [ ] **Rate limiting** configurado
- [ ] **Logs** configurados
- [ ] **PM2** em cluster mode
- [ ] **Nginx** com otimizações
- [ ] **SSL** configurado (se necessário)
- [ ] **Backup** automático configurado

## 🎯 Próximos Passos

### Otimizações Futuras

1. **Redis Cache** - Para dados frequentes
2. **CDN** - Para assets estáticos
3. **Database Pooling** - Para Supabase
4. **Microservices** - Para módulos específicos
5. **Kubernetes** - Para orquestração

### Monitoramento Avançado

1. **APM** - Application Performance Monitoring
2. **Logs Centralizados** - ELK Stack
3. **Alertas** - Slack/Email
4. **Dashboards** - Grafana

## 📞 Suporte

Para questões de escalabilidade:

1. **Monitoramento**: `npm run monitor`
2. **Logs**: `/var/log/consert/`
3. **PM2**: `pm2 status`
4. **Performance**: `npm run test:performance`

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Capacidade**: 50-100 usuários simultâneos
