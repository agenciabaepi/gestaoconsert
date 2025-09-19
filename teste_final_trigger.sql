-- =====================================================
-- TESTE FINAL DO TRIGGER
-- =====================================================

-- 1. Verificar se nosso trigger de teste existe
SELECT 'TRIGGER TESTE' as info, count(*) as existe
FROM information_schema.triggers 
WHERE trigger_name = 'teste_trigger_simples';

-- 2. Contar comissões antes
SELECT 'ANTES DO TESTE' as momento, COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 3. Fazer um update simples que deve disparar o trigger
DO $$
DECLARE
    os_record RECORD;
BEGIN
    -- Pegar uma OS qualquer
    SELECT * INTO os_record 
    FROM ordens_servico 
    WHERE numero_os = '921'
    LIMIT 1;
    
    IF os_record.id IS NOT NULL THEN
        RAISE NOTICE '=== INICIANDO TESTE ===';
        RAISE NOTICE 'OS ID: %', os_record.id;
        RAISE NOTICE 'Status atual: %', os_record.status;
        
        -- Update que deve disparar o trigger
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_record.id;
        
        RAISE NOTICE 'UPDATE EXECUTADO';
        RAISE NOTICE '=== FIM DO TESTE ===';
    ELSE
        RAISE NOTICE 'OS 921 NAO ENCONTRADA';
    END IF;
END $$;

-- 4. Contar comissões depois
SELECT 'DEPOIS DO TESTE' as momento, COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 5. Verificar se o trigger de comissão também existe
SELECT 'TRIGGER COMISSAO' as info, count(*) as existe
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 6. Mostrar todas as funções de trigger que existem
SELECT 
    'FUNCOES TRIGGER' as info,
    routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%trigger%' OR routine_name LIKE '%comiss%';
