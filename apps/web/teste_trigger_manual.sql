-- =====================================================
-- TESTE MANUAL DO TRIGGER
-- =====================================================

-- Vamos fazer um teste bem simples e direto
DO $$
DECLARE
    test_os_id UUID;
    old_status TEXT;
    result_count INTEGER;
BEGIN
    -- Pegar uma OS específica do Pedro com valor
    SELECT id, status INTO test_os_id, old_status
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome ILIKE '%Pedro%'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NULL THEN
        RAISE NOTICE 'Nenhuma OS do Pedro encontrada!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando OS: % com status atual: %', test_os_id, old_status;
    
    -- Primeiro, garantir que não está ENTREGUE
    UPDATE ordens_servico 
    SET status = 'CONCLUIDO'
    WHERE id = test_os_id;
    
    RAISE NOTICE 'Status alterado para CONCLUIDO';
    
    -- Agora mudar para ENTREGUE (deve disparar o trigger)
    UPDATE ordens_servico 
    SET status = 'ENTREGUE'
    WHERE id = test_os_id;
    
    RAISE NOTICE 'Status alterado para ENTREGUE - trigger deve ter disparado';
    
    -- Verificar se foi inserido na tabela de comissões
    SELECT COUNT(*) INTO result_count
    FROM comissoes_historico
    WHERE ordem_servico_id = test_os_id;
    
    RAISE NOTICE 'Comissões encontradas para esta OS: %', result_count;
    
    -- Verificar total geral
    SELECT COUNT(*) INTO result_count FROM comissoes_historico;
    RAISE NOTICE 'Total de comissões na tabela: %', result_count;
    
END $$;
