-- =====================================================
-- VERIFICAR E CORRIGIR CAMPOS DA TABELA ORDENS_SERVICO
-- =====================================================

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordens_servico' 
ORDER BY ordinal_position;

-- 2. Verificar se os campos necessários existem
SELECT 
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'problema_relatado'
  ) as problema_relatado_existe,
  
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'observacao'
  ) as observacao_existe,
  
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'relato'
  ) as relato_existe;

-- 3. Adicionar campo problema_relatado se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'problema_relatado'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN problema_relatado TEXT;
    RAISE NOTICE 'Coluna problema_relatado adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna problema_relatado já existe';
  END IF;
END $$;

-- 4. Adicionar campo observacao se não existir
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

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_problema_relatado ON ordens_servico(problema_relatado);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_observacao ON ordens_servico(observacao);

-- 6. Adicionar comentários para documentar os campos
COMMENT ON COLUMN ordens_servico.problema_relatado IS 'Descrição do problema relatado pelo cliente';
COMMENT ON COLUMN ordens_servico.observacao IS 'Observações técnicas ou adicionais sobre a OS';

-- 7. Verificar se foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordens_servico' 
AND column_name IN ('problema_relatado', 'observacao')
ORDER BY column_name;

-- 8. Verificar dados existentes
SELECT 
  COUNT(*) as total_os,
  COUNT(problema_relatado) as os_com_problema_relatado,
  COUNT(observacao) as os_com_observacao
FROM ordens_servico;

-- 9. Mostrar algumas O.S. de exemplo
SELECT 
  id,
  numero_os,
  problema_relatado,
  observacao,
  created_at
FROM ordens_servico 
WHERE problema_relatado IS NOT NULL OR observacao IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
