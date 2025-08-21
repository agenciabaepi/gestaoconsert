-- Script simples para criar a tabela pagamentos
-- Execute este script no seu Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pagamentos'
) as tabela_existe;

-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  ordem_servico_id UUID,
  
  -- Dados do Mercado Pago
  mercadopago_payment_id VARCHAR(255),
  mercadopago_preference_id VARCHAR(255),
  mercadopago_external_reference VARCHAR(255),
  
  -- Dados do pagamento
  valor DECIMAL(10,2) NOT NULL,
  metodo_pagamento VARCHAR(50) NOT NULL DEFAULT 'pix',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(100),
  
  -- Dados do PIX
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration_date TIMESTAMP,
  
  -- Dados de notificação
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa_id ON pagamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- Verificar se foi criada
SELECT COUNT(*) as total_pagamentos FROM pagamentos; 