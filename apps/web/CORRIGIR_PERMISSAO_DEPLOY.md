# 🔧 Corrigir Permissão do Deploy no VPS

## 🚨 **Problema Identificado**
O webhook está falhando com erro de permissão:
```
❌ Erro no deploy: Error: Command failed: ./deploy.sh
/bin/sh: 1: ./deploy.sh: Permission denied
```

## ✅ **Solução - Execute no VPS:**

### **1. Corrigir permissão do script:**
```bash
cd /opt/gestaoconsert
chmod +x deploy.sh
ls -la deploy.sh
```

### **2. Verificar se a permissão foi aplicada:**
```bash
# Deve mostrar algo como: -rwxr-xr-x
ls -la deploy.sh
```

### **3. Testar o script manualmente:**
```bash
# Testar se executa
./deploy.sh

# Ou verificar sintaxe
bash -n deploy.sh
```

### **4. Se ainda houver problema, verificar conteúdo:**
```bash
# Ver primeiras linhas
head -5 deploy.sh

# Ver se tem shebang correto
grep "^#!" deploy.sh
```

### **5. Recriar permissões se necessário:**
```bash
# Remover e recriar permissões
chmod 755 deploy.sh

# Ou definir permissões específicas
chmod u+x,g+x,o+x deploy.sh
```

### **6. Verificar proprietário do arquivo:**
```bash
# Ver quem é o dono
ls -la deploy.sh

# Se necessário, mudar proprietário
chown root:root deploy.sh
```

### **7. Testar webhook novamente:**
```bash
# Fazer um commit no Git para testar
# Ou testar manualmente
curl -X POST http://localhost:3001/webhook
```

## 🔍 **Comandos para executar em sequência:**

```bash
# 1. Navegar para o diretório
cd /opt/gestaoconsert

# 2. Corrigir permissão
chmod +x deploy.sh

# 3. Verificar permissão
ls -la deploy.sh

# 4. Testar execução
./deploy.sh

# 5. Ver logs do PM2
pm2 logs webhook
```

## 📋 **Verificação Final:**

Após executar os comandos, o arquivo deve ter permissões assim:
```
-rwxr-xr-x 1 root root 1234 Aug 21 13:00 deploy.sh
```

**Status: 🔧 AGUARDANDO EXECUÇÃO NO VPS**
