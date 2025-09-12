-- =====================================================
-- ADICIONAR CAMPOS RELATO E OBSERVAÇÃO NA TABELA ORDENS_SERVICO
-- =====================================================

-- Verificar se as colunas já existem
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'ordens_servico' 
  AND column_name = 'relato'
) as relato_existe;

SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'ordens_servico' 
  AND column_name = 'observacao'
) as observacao_existe;

-- Adicionar coluna relato se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'relato'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN relato TEXT;
    RAISE NOTICE 'Coluna relato adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna relato já existe';
  END IF;
END $$;

-- Adicionar coluna observacao se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'observacao'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN observacao TEXT;
    RAISE NOTICE 'Coluna observacao adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna observacao já existe';
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_relato ON ordens_servico(relato);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_observacao ON ordens_servico(observacao);

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN ordens_servico.relato IS 'Relato do problema pelo cliente';
COMMENT ON COLUMN ordens_servico.observacao IS 'Observações técnicas ou adicionais sobre a OS';

-- Verificar se foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordens_servico' 
AND column_name IN ('relato', 'observacao')
ORDER BY column_name;

-- Verificar estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordens_servico' 
ORDER BY ordinal_position;
