-- =====================================================
-- CORRIGIR TECNICO_ID NAS ORDENS
-- =====================================================

-- 1. Ver o ID correto do Pedro
SELECT 
  'ID CORRETO DO PEDRO' as info,
  id,
  nome,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome = 'Pedro Oliveira';

-- 2. Ver OSs que estão com tecnico_id errado
SELECT 
  'OSs COM TECNICO_ID ERRADO' as problema,
  os.id,
  os.numero_os,
  os.tecnico_id as tecnico_id_atual,
  os.status,
  os.valor_servico
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL 
  AND u.id IS NULL
LIMIT 5;

-- 3. Corrigir as OSs que devem ser do Pedro
-- (vamos assumir que OSs com tecnico_id inválido são do Pedro)
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 4. Verificar se corrigiu
SELECT 
  'OSs CORRIGIDAS' as resultado,
  COUNT(*) as total_corrigidas
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 5. Ver OSs do Pedro que estão ENTREGUE
SELECT 
  'OSs DO PEDRO ENTREGUE' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome = 'Pedro Oliveira'
  AND os.status = 'ENTREGUE'
ORDER BY os.created_at DESC
LIMIT 5;

-- 6. Testar o trigger em uma OS do Pedro
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar uma OS do Pedro
    SELECT os.id INTO test_os_id
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome = 'Pedro Oliveira'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        -- Forçar trigger
        UPDATE ordens_servico 
        SET status = 'APROVADO' 
        WHERE id = test_os_id;
        
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE 'Teste: OS %, Comissões antes: %, depois: %', 
                     test_os_id, comissoes_antes, comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE 'SUCESSO! Trigger funcionou!';
        ELSE
            RAISE NOTICE 'Trigger ainda não funcionou...';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS do Pedro encontrada';
    END IF;
END $$;

-- 7. Verificar total de comissões final
SELECT 
  'TOTAL FINAL' as resultado,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;
