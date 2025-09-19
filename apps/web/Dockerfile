# Build de produção simples e funcional
FROM node:18-alpine

# Atualizar e instalar dependências básicas primeiro
RUN apk update && apk add --no-cache \
    bash \
    && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libc6-compat

# Definir variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev) para o build
RUN npm ci

# Configurações de ambiente
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Configurar variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL=https://nxamrvfusyrtkcshehfm.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlaGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjEzMTAsImV4cCI6MjA2MzQzNzMxMH0.CWTKEVlWcMeRTv8kHgsPkk-WzoHxypFDb_QSf-DLPAQ
ARG SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlaGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MTMxMCwiZXhwIjoyMDYzNDM3MzEwfQ.ax2dDACyrsila_Z97fjupFITA7DplPOTXoqyp-bezKc

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Copiar código da aplicação
COPY . .

# Fazer build de produção
RUN npm run build

# Limpar e reinstalar apenas dependências de produção
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Expor porta
EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Usar modo produção
CMD ["npm", "start"]
