#!/bin/bash

echo "🎯 FIX DIRETO - Vamos resolver isso agora!"

cd /opt/gestaoconsert

echo "1. Parando tudo..."
docker-compose down

echo "2. Fazendo build LOCAL do Next.js..."
npm install
npm run build

echo "3. Verificando se o build foi criado..."
if [ -d ".next" ]; then
    echo "✅ Build criado com sucesso!"
    ls -la .next/
else
    echo "❌ Erro no build"
    exit 1
fi

echo "4. Criando Dockerfile simples..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF

echo "5. Reconstruindo Docker..."
docker build -t gestaoconsert-app .

echo "6. Iniciando container..."
docker run -d --name gestaoconsert-app -p 3001:3000 gestaoconsert-app

echo "7. Testando..."
sleep 10
curl http://localhost:3001 || echo "App não respondeu"

echo "✅ PRONTO!"
