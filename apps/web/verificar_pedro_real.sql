-- =====================================================
-- VERIFICAR O ID REAL DO PEDRO NO BANCO
-- =====================================================

-- 1. Buscar Pedro de todas as formas possíveis
SELECT 
  'PROCURANDO PEDRO' as info,
  id,
  nome,
  nivel,
  email,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome ILIKE '%Pedro%' 
   OR nome ILIKE '%Oliveira%'
   OR email ILIKE '%pedro%'
ORDER BY nome;

-- 2. Ver todos os técnicos
SELECT 
  'TODOS OS TÉCNICOS' as info,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 3. Ver OSs que têm tecnico_id (para descobrir quais IDs estão sendo usados)
SELECT DISTINCT
  'TECNICO_IDs EM USO' as info,
  os.tecnico_id,
  u.nome as tecnico_nome,
  COUNT(os.id) as total_os
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome
ORDER BY total_os DESC;

-- 4. Ver OSs com tecnico_id inválido
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  tecnico_id,
  COUNT(*) as quantidade
FROM ordens_servico os
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios)
GROUP BY tecnico_id;

-- 5. Se Pedro existe, testar o trigger com o ID correto
DO $$
DECLARE
    pedro_id UUID;
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Encontrar o ID real do Pedro
    SELECT id INTO pedro_id
    FROM usuarios 
    WHERE nome ILIKE '%Pedro%' 
       OR nome ILIKE '%Oliveira%'
    LIMIT 1;
    
    IF pedro_id IS NOT NULL THEN
        RAISE NOTICE 'Pedro encontrado com ID: %', pedro_id;
        
        -- Atualizar OSs para usar o Pedro correto
        UPDATE ordens_servico 
        SET tecnico_id = pedro_id
        WHERE tecnico_id IS NOT NULL 
          AND tecnico_id NOT IN (SELECT id FROM usuarios);
        
        -- Pegar uma OS do Pedro
        SELECT os.id INTO test_os_id
        FROM ordens_servico os
        WHERE os.tecnico_id = pedro_id
          AND os.valor_servico > 0
        LIMIT 1;
        
        IF test_os_id IS NOT NULL THEN
            -- Contar comissões antes
            SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
            
            RAISE NOTICE 'Testando trigger com OS: %, Comissões antes: %', test_os_id, comissoes_antes;
            
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
                RAISE NOTICE 'SUCESSO! Trigger funcionou!';
            ELSE
                RAISE NOTICE 'Trigger ainda não funcionou...';
            END IF;
        ELSE
            RAISE NOTICE 'Nenhuma OS do Pedro encontrada';
        END IF;
    ELSE
        RAISE NOTICE 'Pedro não encontrado na tabela usuarios!';
    END IF;
END $$;
