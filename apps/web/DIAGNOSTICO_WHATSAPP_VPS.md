# 🔧 Diagnóstico WhatsApp VPS - Hostinger

## 🚨 **Problema Atual**
WhatsApp não está gerando QR Code no ambiente VPS da Hostinger.

## 🔍 **Possíveis Causas**

### **1. Chrome/Chromium não instalado**
```bash
# Verificar se Chrome está instalado
which chromium-browser
which google-chrome
which chromium

# Instalar Chrome no Ubuntu/Debian
sudo apt update
sudo apt install -y chromium-browser

# Ou instalar Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

### **2. Dependências do sistema faltando**
```bash
# Instalar dependências necessárias
sudo apt install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget
```

### **3. Memória insuficiente**
```bash
# Verificar memória disponível
free -h

# Verificar espaço em disco
df -h

# Criar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### **4. Permissões de escrita**
```bash
# Verificar permissões do diretório da aplicação
ls -la /path/to/app/

# Criar diretório de sessões
mkdir -p whatsapp-sessions
chmod 755 whatsapp-sessions

# Verificar se o usuário pode escrever
touch whatsapp-sessions/test.txt
```

### **5. Firewall/Portas bloqueadas**
```bash
# Verificar portas abertas
sudo netstat -tulpn | grep LISTEN

# Verificar firewall
sudo ufw status

# Abrir porta se necessário
sudo ufw allow 3000
```

## 🐳 **Se usando Docker**

### **Dockerfile otimizado para WhatsApp:**
```dockerfile
FROM node:18-slim

# Instalar dependências do Chrome
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Continuar com a aplicação...
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### **docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./whatsapp-sessions:/app/whatsapp-sessions
    environment:
      - NODE_ENV=production
    mem_limit: 2g
    shm_size: 1g
```

## 🛠️ **Scripts de Teste**

### **1. Testar Chrome**
```bash
# Criar script de teste
cat > test-chrome.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Chrome funciona!');
    await browser.close();
  } catch (error) {
    console.error('❌ Erro no Chrome:', error);
  }
})();
EOF

# Executar teste
node test-chrome.js
```

### **2. Testar WhatsApp Web.js**
```bash
# Criar script de teste
cat > test-whatsapp.js << 'EOF'
const { Client } = require('whatsapp-web.js');

const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('✅ QR Code gerado:', qr.substring(0, 50) + '...');
});

client.on('ready', () => {
  console.log('✅ WhatsApp pronto!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

client.initialize();
EOF

# Executar teste
node test-whatsapp.js
```

## 📋 **Checklist de Verificação**

- [ ] Chrome/Chromium instalado
- [ ] Dependências do sistema instaladas
- [ ] Memória suficiente (mínimo 1GB livre)
- [ ] Espaço em disco suficiente
- [ ] Permissões de escrita no diretório
- [ ] Portas abertas no firewall
- [ ] Node.js versão compatível (16+)
- [ ] whatsapp-web.js instalado

## 🚀 **Comandos para Executar no VPS**

### **Setup completo:**
```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# 4. Instalar dependências
sudo apt install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# 5. Criar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 6. Fazer deploy da aplicação
cd /path/to/app
npm install
npm run build
npm start
```

## 🔍 **Como Debuggar**

### **1. Verificar logs da aplicação:**
```bash
# Logs do PM2 (se usando)
pm2 logs

# Logs do Docker (se usando)
docker logs container_name

# Logs do sistema
journalctl -u your-app-name
```

### **2. Testar conexão manual:**
```bash
# Testar se a API está respondendo
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"empresa_id":"test"}'
```

### **3. Monitorar recursos:**
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Processos do Chrome
ps aux | grep chrome
```

## 📞 **Suporte**

Se após seguir todos os passos o problema persistir, verifique:

1. **Logs de erro específicos** no console
2. **Versão do Node.js** e dependências
3. **Configurações do VPS** da Hostinger
4. **Limites de memória** do plano

**Status: 🔧 DIAGNÓSTICO PRONTO**
