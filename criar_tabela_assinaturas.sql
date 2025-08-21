-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Dados da assinatura
  plano VARCHAR(50) NOT NULL, -- 'basico', 'pro', 'avancado'
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'cancelled', 'expired'
  
  -- Datas importantes
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados do Mercado Pago
  mercadopago_subscription_id VARCHAR(255),
  mercadopago_preference_id VARCHAR(255),
  
  -- Configurações
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50) DEFAULT 'pix',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_assinaturas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_trial_end_date ON assinaturas(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_assinaturas_subscription_end_date ON assinaturas(subscription_end_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_assinaturas_updated_at 
    BEFORE UPDATE ON assinaturas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular trial_end_date (15 dias)
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trial_end_date = NEW.trial_start_date + INTERVAL '15 days';
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_trial_end_date_trigger
    BEFORE INSERT ON assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION set_trial_end_date();

-- Comentários para documentação
COMMENT ON TABLE assinaturas IS 'Tabela para gerenciar assinaturas dos planos';
COMMENT ON COLUMN assinaturas.plano IS 'Tipo do plano: basico, pro, avancado';
COMMENT ON COLUMN assinaturas.status IS 'Status da assinatura: trial, active, cancelled, expired';
COMMENT ON COLUMN assinaturas.auto_renew IS 'Se a assinatura renova automaticamente'; 