-- =====================================================
-- ATUALIZAÇÃO DOS LIMITES DO PLANO TRIAL
-- =====================================================

-- Atualizar os limites do plano Trial conforme especificado
UPDATE planos 
SET 
    limite_usuarios = 2,
    limite_produtos = 15,
    limite_clientes = 15,
    limite_fornecedores = 15,
    updated_at = NOW()
WHERE nome = 'Trial';

-- Adicionar limite de ordens de serviço (se não existir na tabela)
-- Primeiro, vamos verificar se a coluna existe
DO $$
BEGIN
    -- Adicionar coluna limite_ordens se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planos' AND column_name = 'limite_ordens'
    ) THEN
        ALTER TABLE planos ADD COLUMN limite_ordens INT DEFAULT 15;
    END IF;
END $$;

-- Atualizar limite de ordens de serviço para o plano Trial
UPDATE planos 
SET 
    limite_ordens = 15,
    updated_at = NOW()
WHERE nome = 'Trial';

-- Verificar se a atualização foi feita corretamente
SELECT 
    nome,
    limite_usuarios,
    limite_produtos,
    limite_clientes,
    limite_fornecedores,
    limite_ordens,
    updated_at
FROM planos 
WHERE nome = 'Trial'; 