-- Adicionar campo prazo_entrega na tabela ordens_servico
-- Execute este script no Supabase Dashboard > SQL Editor

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ordens_servico' 
        AND column_name = 'prazo_entrega'
    ) THEN
        -- Adicionar a coluna prazo_entrega
        ALTER TABLE ordens_servico 
        ADD COLUMN prazo_entrega TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Coluna prazo_entrega adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna prazo_entrega já existe!';
    END IF;
END $$;

-- Verificar se foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'prazo_entrega';