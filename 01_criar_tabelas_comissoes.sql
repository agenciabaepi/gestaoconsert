-- =====================================================
-- PASSO 1: CRIAR ESTRUTURA DE COMISSÕES
-- Execute este script PRIMEIRO
-- =====================================================

-- 1. Adicionar campos de comissão na tabela usuarios para técnicos
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS comissao_ativa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comissao_observacoes TEXT;

-- 2. Adicionar campo para identificar tipo de ordem na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'normal'; -- 'normal', 'retorno', 'garantia'

-- 3. Tabela para configurações de comissão da empresa
CREATE TABLE IF NOT EXISTS configuracoes_comissao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Configurações gerais
  comissao_padrao DECIMAL(5,2) DEFAULT 10.00, -- Porcentagem padrão para novos técnicos
  comissao_apenas_servico BOOLEAN DEFAULT true, -- Se true, comissão apenas sobre valor_servico
  comissao_retorno_ativo BOOLEAN DEFAULT false, -- Se técnico ganha comissão em retornos
  
  -- Observações
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas uma configuração por empresa
  UNIQUE(empresa_id)
);

-- 4. Tabela para histórico de comissões
CREATE TABLE IF NOT EXISTS comissoes_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tecnico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Valores da OS
  valor_servico DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_peca DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Comissão calculada
  percentual_comissao DECIMAL(5,2) NOT NULL,
  valor_comissao DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Tipo de ordem (normal ou retorno/garantia)
  tipo_ordem VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'normal' ou 'retorno'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
  
  -- Datas
  data_entrega TIMESTAMP WITH TIME ZONE NOT NULL, -- Data que a OS foi entregue
  data_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Data que a comissão foi calculada
  data_pagamento TIMESTAMP WITH TIME ZONE, -- Data que foi paga (se aplicável)
  
  -- Observações
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inserir configurações padrão para empresas existentes
INSERT INTO configuracoes_comissao (empresa_id, comissao_padrao, comissao_apenas_servico, comissao_retorno_ativo)
SELECT 
  id as empresa_id,
  10.00 as comissao_padrao,
  true as comissao_apenas_servico,
  false as comissao_retorno_ativo
FROM empresas 
WHERE id NOT IN (SELECT empresa_id FROM configuracoes_comissao WHERE empresa_id IS NOT NULL);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comissoes_historico_tecnico_id ON comissoes_historico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_historico_ordem_id ON comissoes_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_historico_empresa_id ON comissoes_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_historico_data_entrega ON comissoes_historico(data_entrega);
CREATE INDEX IF NOT EXISTS idx_comissoes_historico_status ON comissoes_historico(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_comissao_ativa ON usuarios(comissao_ativa) WHERE comissao_ativa = true;

-- 7. Comentários para documentação
COMMENT ON TABLE comissoes_historico IS 'Histórico de comissões calculadas para técnicos baseado em OSs entregues';
COMMENT ON TABLE configuracoes_comissao IS 'Configurações de comissão por empresa';
COMMENT ON COLUMN usuarios.comissao_percentual IS 'Percentual de comissão do técnico (ex: 10.00 para 10%)';
COMMENT ON COLUMN usuarios.comissao_ativa IS 'Se o técnico está ativo para receber comissões';
COMMENT ON COLUMN ordens_servico.tipo IS 'Tipo da ordem: normal, retorno ou garantia';

-- 8. Verificar se as colunas foram criadas com sucesso
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('usuarios', 'ordens_servico', 'configuracoes_comissao', 'comissoes_historico')
  AND column_name IN ('comissao_percentual', 'comissao_ativa', 'comissao_observacoes', 'tipo')
ORDER BY table_name, column_name;

-- 9. Verificar resultado
SELECT 
  'Estrutura criada com sucesso!' as status,
  COUNT(*) as total_empresas_com_config
FROM configuracoes_comissao;
