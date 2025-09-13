-- Script para corrigir problemas de schema do banco de dados

-- 1. Adicionar coluna 'ativo' na tabela empresas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'ativo'
    ) THEN
        ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT true;
        COMMENT ON COLUMN empresas.ativo IS 'Indica se a empresa está ativa no sistema';
        
        -- Atualizar empresas existentes para ativo = true
        UPDATE empresas SET ativo = true WHERE ativo IS NULL;
        
        RAISE NOTICE 'Coluna "ativo" adicionada à tabela empresas';
    ELSE
        RAISE NOTICE 'Coluna "ativo" já existe na tabela empresas';
    END IF;
END $$;

-- 2. Adicionar coluna 'description' na tabela ordens_servico se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordens_servico' AND column_name = 'description'
    ) THEN
        ALTER TABLE ordens_servico ADD COLUMN description TEXT;
        COMMENT ON COLUMN ordens_servico.description IS 'Descrição detalhada da ordem de serviço';
        
        -- Migrar dados do campo 'descricao' se existir
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ordens_servico' AND column_name = 'descricao'
        ) THEN
            UPDATE ordens_servico SET description = descricao WHERE description IS NULL;
            RAISE NOTICE 'Dados migrados de "descricao" para "description"';
        END IF;
        
        RAISE NOTICE 'Coluna "description" adicionada à tabela ordens_servico';
    ELSE
        RAISE NOTICE 'Coluna "description" já existe na tabela ordens_servico';
    END IF;
END $$;

-- 3. Verificar estrutura das tabelas principais
SELECT 
    'empresas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas'
ORDER BY ordinal_position;

SELECT 
    'ordens_servico' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
ORDER BY ordinal_position;

-- 4. Verificar se as correções foram aplicadas
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'ativo')
        THEN '✅ Coluna ativo existe na tabela empresas'
        ELSE '❌ Coluna ativo NÃO existe na tabela empresas'
    END as status_empresas_ativo;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'description')
        THEN '✅ Coluna description existe na tabela ordens_servico'
        ELSE '❌ Coluna description NÃO existe na tabela ordens_servico'
    END as status_ordens_description;