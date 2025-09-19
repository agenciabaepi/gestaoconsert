-- =====================================================
-- TESTAR TRIGGER DIRETAMENTE
-- =====================================================

-- Primeiro, vamos ver se o trigger está realmente funcionando
-- Vamos habilitar o log de todas as operações

-- 1. Verificar se existe algum erro no trigger
DO $$
BEGIN
    -- Tentar disparar o trigger manualmente
    RAISE NOTICE 'Iniciando teste do trigger...';
    
    -- Pegar uma OS específica
    UPDATE ordens_servico 
    SET status = 'PENDENTE'
    WHERE id = (
        SELECT os.id 
        FROM ordens_servico os
        JOIN usuarios u ON os.tecnico_id = u.id
        WHERE u.nome ILIKE '%Pedro%'
          AND os.valor_servico > 0
        LIMIT 1
    );
    
    RAISE NOTICE 'Status alterado para PENDENTE';
    
    -- Agora mudar para ENTREGUE
    UPDATE ordens_servico 
    SET status = 'ENTREGUE'
    WHERE id = (
        SELECT os.id 
        FROM ordens_servico os
        JOIN usuarios u ON os.tecnico_id = u.id
        WHERE u.nome ILIKE '%Pedro%'
          AND os.valor_servico > 0
        LIMIT 1
    );
    
    RAISE NOTICE 'Status alterado para ENTREGUE';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no trigger: % - %', SQLSTATE, SQLERRM;
END $$;

-- Verificar quantas comissões temos agora
SELECT 
  'APÓS TESTE TRIGGER' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;
