# 🚀 Instruções para Deploy no VPS

## Resumo das Correções Realizadas

✅ **Problema identificado**: URL incorreta do Supabase causando erros `net::ERR_NAME_NOT_RESOLVED`
✅ **Correções aplicadas**:
- Dockerfile: `nxamrvfusyrtkcsehefm` → `nxamrvfusyrtkcshehfm`
- docker-compose.yml: Chaves JWT atualizadas com referência correta
✅ **Código commitado e enviado** para o repositório

## 📋 Passos para Deploy no VPS

### 1. Conectar no VPS
```bash
ssh usuario@seu-vps-ip
```

### 2. Navegar para o diretório da aplicação
```bash
cd /caminho/para/sua/aplicacao
```

### 3. Fazer backup (opcional mas recomendado)
```bash
# Backup dos logs atuais
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
docker-compose logs > backup_$(date +%Y%m%d_%H%M%S)/logs_antes_deploy.txt
```

### 4. Executar o script de deploy
```bash
# Fazer pull do script de deploy
git pull origin master

# Executar o deploy automático
./deploy-vps.sh
```

## 🔧 Deploy Manual (se preferir)

Se preferir fazer o deploy passo a passo:

```bash
# 1. Parar aplicação
docker-compose down

# 2. Fazer pull das atualizações
git pull origin master

# 3. Verificar se as correções estão presentes
grep "nxamrvfusyrtkcshehfm" docker-compose.yml Dockerfile

# 4. Limpar cache e rebuild
docker-compose build --no-cache

# 5. Iniciar aplicação
docker-compose up -d

# 6. Verificar logs
docker-compose logs -f app
```

## 🔍 Verificações Pós-Deploy

### 1. Status dos Containers
```bash
docker-compose ps
```

### 2. Logs da Aplicação
```bash
# Logs em tempo real
docker-compose logs -f app

# Últimas 50 linhas
docker-compose logs --tail=50 app
```

### 3. Teste de Conectividade
```bash
# Testar se a aplicação está respondendo
curl -I http://localhost:3000
```

### 4. Verificar se Erros de DNS Pararam
```bash
# Procurar por erros de DNS nos logs
docker-compose logs app | grep "ERR_NAME_NOT_RESOLVED"

# Se não retornar nada, os erros pararam ✅
```

## 🚨 Troubleshooting

### Se a aplicação não iniciar:
```bash
# Verificar logs detalhados
docker-compose logs app

# Verificar recursos do sistema
df -h
free -h
docker system df
```

### Se ainda houver erros de DNS:
```bash
# Verificar se as correções foram aplicadas
grep -n "nxamrvfusyrtkcshehfm" Dockerfile docker-compose.yml

# Forçar rebuild completo
docker-compose down
docker system prune -a -f
docker-compose build --no-cache
docker-compose up -d
```

### Rollback (se necessário):
```bash
# Voltar para commit anterior
git log --oneline -5
git reset --hard COMMIT_ANTERIOR
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Comandos Úteis

```bash
# Monitoramento
docker-compose logs -f app              # Logs em tempo real
docker-compose ps                        # Status containers
docker stats                             # Uso de recursos

# Manutenção
docker-compose restart app               # Reiniciar apenas app
docker-compose down && docker-compose up -d  # Restart completo
docker system prune -f                   # Limpar cache

# Debug
docker-compose exec app sh               # Entrar no container
docker-compose logs --tail=100 app       # Últimos 100 logs
```

## ✅ Checklist Pós-Deploy

- [ ] Aplicação iniciou sem erros
- [ ] Logs não mostram `ERR_NAME_NOT_RESOLVED`
- [ ] Login funciona corretamente
- [ ] Dashboard carrega sem erros
- [ ] Funcionalidades principais testadas
- [ ] Performance está normal

## 📞 Suporte

Se encontrar problemas:
1. Capture os logs: `docker-compose logs app > logs_erro.txt`
2. Verifique o status: `docker-compose ps`
3. Documente o erro específico

---

**Última atualização**: $(date)
**Correções aplicadas**: URL Supabase e chaves JWT
**Status**: Pronto para deploy ✅