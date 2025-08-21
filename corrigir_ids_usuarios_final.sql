-- =====================================================
-- CORRIGIR IDs DE USUÁRIOS - VERSÃO FINAL
-- =====================================================

-- 1. Ver usuários existentes
SELECT 
  'USUÁRIOS REAIS NO BANCO' as info,
  id,
  nome,
  nivel,
  email
FROM usuarios 
ORDER BY nome;

-- 2. Ver qual ID está sendo usado erradamente
SELECT 
  'ID PROBLEMÁTICO' as problema,
  'c7f16254-fce9-49cd-9956-2189b0de53c7' as id_errado,
  COUNT(*) as quantidade_os
FROM ordens_servico 
WHERE tecnico_id = 'c7f16254-fce9-49cd-9956-2189b0de53c7';

-- 3. Corrigir: pegar o primeiro técnico disponível e usar para todas as OSs órfãs
UPDATE ordens_servico 
SET tecnico_id = (
  SELECT id 
  FROM usuarios 
  WHERE nivel = 'tecnico' 
  LIMIT 1
)
WHERE tecnico_id = 'c7f16254-fce9-49cd-9956-2189b0de53c7';

-- 4. Verificar se corrigiu
SELECT 
  'OSs CORRIGIDAS' as resultado,
  os.tecnico_id,
  u.nome as tecnico_nome,
  COUNT(*) as total_os
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome;

-- 5. Ativar comissão para todos os técnicos
UPDATE usuarios 
SET 
  comissao_ativa = true,
  comissao_percentual = 10.00,
  comissao_observacoes = 'Comissão ativada automaticamente'
WHERE nivel = 'tecnico';

-- 6. Verificar técnicos com comissão
SELECT 
  'TÉCNICOS COM COMISSÃO' as info,
  nome,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico';

-- 7. Testar trigger com uma OS real
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    tecnico_nome TEXT;
BEGIN
    -- Pegar uma OS de qualquer técnico
    SELECT 
      os.id,
      u.nome
    INTO test_os_id, tecnico_nome
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE os.valor_servico > 0
      AND u.nivel = 'tecnico'
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando com OS: % do técnico: %', test_os_id, tecnico_nome;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Forçar trigger
        UPDATE ordens_servico 
        SET status = 'APROVADO' 
        WHERE id = test_os_id;
        
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou! Nova comissão calculada!';
        ELSE
            RAISE NOTICE '❌ Trigger não funcionou...';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS com técnico válido encontrada';
    END IF;
END $$;

-- 8. Mostrar resultado final
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  COUNT(*) as total_comissoes,
  SUM(ch.valor_comissao) as valor_total
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
GROUP BY ch.tecnico_id, u.nome;
