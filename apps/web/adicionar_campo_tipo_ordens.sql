-- =====================================================
-- ADICIONAR CAMPO TIPO NA TABELA ORDENS_SERVICO
-- Para identificar retornos e outros tipos de OS
-- =====================================================

-- Adicionar coluna tipo se não existir
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Normal';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_tipo ON ordens_servico(tipo);

-- Atualizar registros existentes (opcional)
-- UPDATE ordens_servico SET tipo = 'Normal' WHERE tipo IS NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' AND column_name = 'tipo';

-- Verificar estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position; 