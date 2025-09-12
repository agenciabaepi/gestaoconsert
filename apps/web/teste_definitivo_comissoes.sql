-- =====================================================
-- TESTE DEFINITIVO DO SISTEMA DE COMISSÕES
-- =====================================================

-- 1. Verificar quantas comissões existem ANTES do teste
SELECT 
  'ANTES DO TESTE' as momento,
  COUNT(*) as total_comissoes,
  COALESCE(SUM(valor_comissao), 0) as valor_total
FROM comissoes_historico;

-- 2. Pegar uma OS específica do Pedro e testar
DO $$
DECLARE
    test_os_id UUID;
    pedro_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Buscar Pedro
    SELECT id INTO pedro_id 
    FROM usuarios 
    WHERE nome ILIKE '%Pedro%' AND nivel = 'tecnico' AND comissao_ativa = true;
    
    IF pedro_id IS NULL THEN
        RAISE NOTICE 'Pedro não encontrado!';
        RETURN;
    END IF;
    
    -- Buscar uma OS do Pedro
    SELECT id INTO test_os_id
    FROM ordens_servico 
    WHERE tecnico_id = pedro_id 
      AND valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NULL THEN
        RAISE NOTICE 'Nenhuma OS do Pedro encontrada!';
        RETURN;
    END IF;
    
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'Pedro ID: %, OS ID: %, Comissões antes: %', pedro_id, test_os_id, comissoes_antes;
    
    -- Garantir que não está ENTREGUE
    UPDATE ordens_servico SET status = 'APROVADO' WHERE id = test_os_id;
    
    -- Mudar para ENTREGUE (deve disparar trigger)
    UPDATE ordens_servico SET status = 'ENTREGUE' WHERE id = test_os_id;
    
    -- Contar comissões depois
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    
    RAISE NOTICE 'Comissões depois: %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE 'SUCESSO! Comissão foi calculada!';
    ELSE
        RAISE NOTICE 'PROBLEMA: Comissão não foi calculada!';
    END IF;
    
END $$;

-- 3. Verificar quantas comissões existem DEPOIS do teste
SELECT 
  'DEPOIS DO TESTE' as momento,
  COUNT(*) as total_comissoes,
  COALESCE(SUM(valor_comissao), 0) as valor_total
FROM comissoes_historico;

-- 4. Mostrar detalhes das comissões (se existirem)
SELECT 
  'DETALHES DAS COMISSÕES' as info,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.tipo_ordem,
  ch.status,
  ch.observacoes,
  os.numero_os,
  u.nome as tecnico_nome
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 5;
