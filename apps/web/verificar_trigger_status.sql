-- =====================================================
-- VERIFICAR STATUS DO TRIGGER
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar se a função existe
SELECT 
  'FUNÇÃO STATUS' as info,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Ver as últimas OSs marcadas como ENTREGUE
SELECT 
  'ÚLTIMAS OSs ENTREGUE' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE'
ORDER BY os.created_at DESC
LIMIT 5;

-- 4. Verificar total de comissões atual
SELECT 
  'TOTAL COMISSÕES ATUAL' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 5. Testar manualmente o trigger em uma OS específica
DO $$
DECLARE
    test_os_id UUID;
BEGIN
    -- Pegar uma OS ENTREGUE do Pedro
    SELECT id INTO test_os_id
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome ILIKE '%Pedro%' 
      AND os.status = 'ENTREGUE'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        RAISE NOTICE 'Testando trigger com OS: %', test_os_id;
        
        -- Forçar trigger mudando status
        UPDATE ordens_servico 
        SET status = 'APROVADO' 
        WHERE id = test_os_id;
        
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        RAISE NOTICE 'Trigger executado!';
    ELSE
        RAISE NOTICE 'Nenhuma OS do Pedro encontrada para teste';
    END IF;
END $$;

-- 6. Verificar se o teste funcionou
SELECT 
  'APÓS TESTE MANUAL' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;
