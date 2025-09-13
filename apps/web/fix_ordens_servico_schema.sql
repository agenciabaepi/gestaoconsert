-- =====================================================
-- CORREÇÃO CRÍTICA: ADICIONAR COLUNA 'description'
-- =====================================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- 
-- PROBLEMA: Os testes estão falhando porque a coluna 'description' 
-- não existe na tabela ordens_servico, mas está sendo referenciada
-- nos testes automatizados (TC002, TC004)

-- 1. Verificar se a coluna já existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
AND column_name = 'description';

-- 2. Adicionar coluna description se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordens_servico' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE ordens_servico ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Coluna description adicionada à tabela ordens_servico';
    ELSE
        RAISE NOTICE '⚠️  Coluna description já existe na tabela ordens_servico';
    END IF;
END $$;

-- 3. Adicionar comentário na coluna
COMMENT ON COLUMN ordens_servico.description IS 'Descrição detalhada da ordem de serviço (usado pelos testes automatizados)';

-- 4. Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
ORDER BY ordinal_position;

-- 5. Teste rápido para confirmar que a coluna foi criada
SELECT COUNT(*) as total_ordens, 
       COUNT(description) as ordens_com_description
FROM ordens_servico;