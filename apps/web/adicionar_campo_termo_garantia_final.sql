-- Script para adicionar campo termo_garantia_id na tabela ordens_servico
-- Execute este script no seu Supabase SQL Editor

-- Verificar se a coluna já existe
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'ordens_servico' 
  AND column_name = 'termo_garantia_id'
) as coluna_existe;

-- Adicionar a coluna se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordens_servico' 
    AND column_name = 'termo_garantia_id'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN termo_garantia_id UUID;
    
    -- Adicionar foreign key constraint se a tabela termos_garantia existir
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'termos_garantia'
    ) THEN
      ALTER TABLE ordens_servico 
      ADD CONSTRAINT fk_ordens_servico_termo_garantia 
      FOREIGN KEY (termo_garantia_id) REFERENCES termos_garantia(id);
    END IF;
    
    RAISE NOTICE 'Coluna termo_garantia_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna termo_garantia_id já existe';
  END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_termo_garantia_id 
ON ordens_servico(termo_garantia_id);

-- Verificar se foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordens_servico' 
AND column_name = 'termo_garantia_id'; 