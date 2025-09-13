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
ARG NEXT_PUBLIC_SUPABASE_URL=https://nxamrvfusyrtkcsheeff.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31
ARG SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzQ3ODYxMzEwLCJleHAiOjIwNjM0MzczMTB9.ax2dDACyrsila_Z97fjupFITA7DplPOTXoqyp-bezKc

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
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar modo produção
CMD ["npm", "start"]
