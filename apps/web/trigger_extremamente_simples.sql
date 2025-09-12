-- =====================================================
-- TRIGGER EXTREMAMENTE SIMPLES
-- =====================================================

-- 1. Criar função super básica que só insere dados fixos
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir dados fixos para testar se o trigger funciona
    INSERT INTO comissoes_historico (
        tecnico_id,
        ordem_servico_id,
        valor_servico,
        percentual_comissao,
        valor_comissao,
        data_entrega,
        empresa_id,
        cliente_id
    ) VALUES (
        '2f17436e-f57a-4c17-8efc-672ad7e85530', -- Pedro
        NEW.id,
        999.99,
        50.00,
        499.99,
        NOW(),
        NEW.empresa_id,
        NEW.cliente_id
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Se der erro, não falhar
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Garantir que o trigger existe
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 3. Verificar se criou
SELECT 
  'TRIGGER CRIADO' as status,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 4. Teste direto
DO $$
DECLARE
    os_id UUID;
    antes INTEGER;
    depois INTEGER;
BEGIN
    SELECT id INTO os_id FROM ordens_servico WHERE numero_os = '921';
    SELECT COUNT(*) INTO antes FROM comissoes_historico;
    
    -- Qualquer update deve disparar o trigger
    UPDATE ordens_servico 
    SET valor_servico = 123.45
    WHERE id = os_id;
    
    SELECT COUNT(*) INTO depois FROM comissoes_historico;
    
    RAISE NOTICE 'Antes: %, Depois: %', antes, depois;
    
    IF depois > antes THEN
        RAISE NOTICE 'TRIGGER BASIC FUNCIONA!';
    ELSE
        RAISE NOTICE 'TRIGGER NAO FUNCIONA - PROBLEMA GRAVE';
    END IF;
END $$;

-- 5. Verificar resultado
SELECT 
  'TESTE BÁSICO' as resultado,
  COUNT(*) as total_comissoes
FROM comissoes_historico;
