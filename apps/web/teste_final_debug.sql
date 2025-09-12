-- =====================================================
-- TESTE FINAL DE DEBUG
-- =====================================================

-- 1. Primeiro, vamos ver EXATAMENTE qual OS vamos testar
DO $$
DECLARE
    test_os_id UUID;
    test_status TEXT;
    test_tecnico_id UUID;
    test_valor DECIMAL(10,2);
BEGIN
    -- Pegar dados completos da OS que vamos testar
    SELECT 
        os.id,
        os.status,
        os.tecnico_id,
        os.valor_servico
    INTO 
        test_os_id,
        test_status,
        test_tecnico_id,
        test_valor
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome ILIKE '%Pedro%'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NULL THEN
        RAISE NOTICE 'PROBLEMA: Nenhuma OS do Pedro encontrada!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'OS ENCONTRADA:';
    RAISE NOTICE '- ID: %', test_os_id;
    RAISE NOTICE '- Status atual: %', test_status;
    RAISE NOTICE '- Técnico ID: %', test_tecnico_id;
    RAISE NOTICE '- Valor serviço: %', test_valor;
    
    -- Agora fazer o teste do trigger com logs detalhados
    RAISE NOTICE 'INICIANDO TESTE DO TRIGGER...';
    
    -- Primeiro, garantir que não está ENTREGUE
    IF test_status = 'ENTREGUE' THEN
        RAISE NOTICE 'OS já está ENTREGUE, mudando para PENDENTE primeiro...';
        UPDATE ordens_servico SET status = 'PENDENTE' WHERE id = test_os_id;
        RAISE NOTICE 'Status alterado para PENDENTE';
    END IF;
    
    -- Agora mudar para ENTREGUE
    RAISE NOTICE 'Mudando status para ENTREGUE...';
    UPDATE ordens_servico SET status = 'ENTREGUE' WHERE id = test_os_id;
    RAISE NOTICE 'UPDATE executado!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no teste: % - %', SQLSTATE, SQLERRM;
END $$;

-- Verificar se disparou
SELECT 
  'RESULTADO FINAL' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- Se ainda não funcionar, vamos ver se existe alguma OS com técnico
SELECT 
  'DEBUG: OSs com técnico' as info,
  COUNT(*) as total_os_com_tecnico
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL;

-- Ver técnicos ativos
SELECT 
  'DEBUG: Técnicos' as info,
  nome,
  nivel,
  comissao_ativa
FROM usuarios 
WHERE nivel = 'tecnico';
