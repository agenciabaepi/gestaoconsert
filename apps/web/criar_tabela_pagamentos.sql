-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ordem_servico_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
  
  -- Dados do Mercado Pago
  mercadopago_payment_id VARCHAR(255) UNIQUE,
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
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices
  CONSTRAINT fk_pagamentos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_pagamentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_pagamentos_ordem FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa_id ON pagamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mercadopago_payment_id ON pagamentos(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pagamentos_updated_at 
    BEFORE UPDATE ON pagamentos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE pagamentos IS 'Tabela para armazenar pagamentos via PIX/Mercado Pago';
COMMENT ON COLUMN pagamentos.mercadopago_payment_id IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN pagamentos.pix_qr_code IS 'QR Code do PIX em formato texto';
COMMENT ON COLUMN pagamentos.pix_qr_code_base64 IS 'QR Code do PIX em formato base64 para exibição';
COMMENT ON COLUMN pagamentos.webhook_data IS 'Dados recebidos do webhook do Mercado Pago'; 