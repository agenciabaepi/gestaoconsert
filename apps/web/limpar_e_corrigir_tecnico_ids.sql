-- =====================================================
-- LIMPAR E CORRIGIR TODOS OS TECNICO_IDS INVÁLIDOS
-- =====================================================

-- 1. Ver todos os usuários reais
SELECT 
  'USUÁRIOS VÁLIDOS' as info,
  id,
  nome,
  nivel,
  auth_user_id
FROM usuarios 
ORDER BY nome;

-- 2. Ver todos os tecnico_ids inválidos
SELECT 
  'IDs INVÁLIDOS' as problema,
  tecnico_id,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios)
GROUP BY tecnico_id;

-- 3. LIMPAR: Colocar NULL em todos os tecnico_ids inválidos
UPDATE ordens_servico 
SET tecnico_id = NULL
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 4. Verificar limpeza
SELECT 
  'APÓS LIMPEZA' as resultado,
  COUNT(*) as total_os_sem_tecnico
FROM ordens_servico 
WHERE tecnico_id IS NULL;

-- 5. Atribuir Pedro para todas as OSs que ficaram sem técnico
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
WHERE tecnico_id IS NULL;

-- 6. Verificar se todas as OSs agora têm técnico válido
SELECT 
  'OSs COM TÉCNICO VÁLIDO' as resultado,
  os.tecnico_id,
  u.nome as tecnico_nome,
  COUNT(*) as total_os
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
GROUP BY os.tecnico_id, u.nome;

-- 7. Verificar se Pedro tem comissão ativa
UPDATE usuarios 
SET 
  comissao_ativa = true,
  comissao_percentual = 10.00,
  comissao_observacoes = 'Comissão ativada - 10% sobre serviços'
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 8. Verificar configuração do Pedro
SELECT 
  'PEDRO CONFIGURADO' as info,
  nome,
  comissao_ativa,
  comissao_percentual,
  comissao_observacoes
FROM usuarios 
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 9. Testar trigger com uma OS do Pedro
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar uma OS do Pedro
    SELECT id INTO test_os_id
    FROM ordens_servico 
    WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        -- Garantir que tem valor de serviço
        UPDATE ordens_servico 
        SET valor_servico = COALESCE(valor_servico, 100.00)
        WHERE id = test_os_id;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE '🔧 Testando trigger com OS: %', test_os_id;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Forçar trigger
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou!';
        ELSE
            RAISE NOTICE '❌ Trigger não funcionou';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhuma OS encontrada';
    END IF;
END $$;

-- 10. Mostrar comissões calculadas
SELECT 
  'COMISSÕES EXISTENTES' as info,
  COUNT(*) as total,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;
