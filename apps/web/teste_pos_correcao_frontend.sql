-- =====================================================
-- TESTE APÓS CORREÇÃO DO FRONTEND
-- =====================================================

-- 1. Verificar se há OSs com tecnico_id inválido ainda
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  COUNT(*) as quantidade
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios);

-- 2. Mostrar técnicos válidos disponíveis
SELECT 
  'TÉCNICOS VÁLIDOS' as info,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 3. Testar com uma OS real existente
DO $$
DECLARE
    os_id_teste UUID;
    tecnico_valido UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar um técnico válido
    SELECT id INTO tecnico_valido 
    FROM usuarios 
    WHERE nivel = 'tecnico' AND comissao_ativa = true 
    LIMIT 1;
    
    -- Pegar uma OS existente
    SELECT id INTO os_id_teste 
    FROM ordens_servico 
    WHERE status != 'ENTREGUE'
    LIMIT 1;
    
    IF tecnico_valido IS NOT NULL AND os_id_teste IS NOT NULL THEN
        RAISE NOTICE '🔧 Usando OS: % e Técnico: %', os_id_teste, tecnico_valido;
        
        -- Atualizar OS para usar técnico válido
        UPDATE ordens_servico 
        SET 
            tecnico_id = tecnico_valido,
            valor_servico = 350.00
        WHERE id = os_id_teste;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Marcar como ENTREGUE
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_id_teste;
        
        RAISE NOTICE '✅ Status alterado para ENTREGUE';
        
        -- Aguardar trigger
        PERFORM pg_sleep(3);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Comissão calculada automaticamente!';
        ELSE
            RAISE NOTICE '❌ Trigger ainda não funcionou';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Não foi possível fazer o teste';
    END IF;
END $$;

-- 4. Mostrar todas as comissões calculadas
SELECT 
  'TODAS AS COMISSÕES' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.data_entrega,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC;

-- 5. Status final
SELECT 
  'STATUS SISTEMA' as info,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COALESCE(SUM(valor_comissao), 0) FROM comissoes_historico) as valor_total_comissoes;
