-- Adicionar campo imagens na tabela ordens_servico
-- Execute este script no Supabase Dashboard > SQL Editor

-- Verificar se o campo já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'imagens';

-- Adicionar campo se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordens_servico' 
        AND column_name = 'imagens'
    ) THEN
        ALTER TABLE ordens_servico ADD COLUMN imagens TEXT;
        RAISE NOTICE 'Campo imagens adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo imagens já existe';
    END IF;
END $$;
