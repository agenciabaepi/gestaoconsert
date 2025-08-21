-- =====================================================
-- DESCOBRIR USUÁRIOS REAIS E USAR UM DELES
-- =====================================================

-- 1. Ver TODOS os usuários que realmente existem
SELECT 
  'USUÁRIOS REAIS' as info,
  id,
  nome,
  nivel,
  email,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
ORDER BY nome;

-- 2. Verificar se existem técnicos
SELECT 
  'TÉCNICOS EXISTENTES' as info,
  id,
  nome,
  comissao_ativa
FROM usuarios 
WHERE nivel = 'tecnico';

-- 3. Se não tem técnicos, vamos pegar qualquer usuário e fazer ele técnico
UPDATE usuarios 
SET 
  nivel = 'tecnico',
  comissao_ativa = true,
  comissao_percentual = 10.00,
  comissao_observacoes = 'Ativado para teste de comissões'
WHERE id = (SELECT id FROM usuarios LIMIT 1);

-- 4. Ver o usuário que vamos usar como técnico
SELECT 
  'TÉCNICO PARA TESTE' as info,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
LIMIT 1;

-- 5. Pegar o ID do primeiro técnico disponível
DO $$
DECLARE
    tecnico_id_real UUID;
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar o ID de um técnico real
    SELECT id INTO tecnico_id_real
    FROM usuarios 
    WHERE nivel = 'tecnico'
    LIMIT 1;
    
    IF tecnico_id_real IS NOT NULL THEN
        RAISE NOTICE '✅ Técnico encontrado: %', tecnico_id_real;
        
        -- Limpar OSs com IDs inválidos
        UPDATE ordens_servico 
        SET tecnico_id = NULL
        WHERE tecnico_id IS NOT NULL 
          AND tecnico_id NOT IN (SELECT id FROM usuarios);
        
        -- Atribuir OSs para o técnico real
        UPDATE ordens_servico 
        SET tecnico_id = tecnico_id_real
        WHERE tecnico_id IS NULL;
        
        RAISE NOTICE '✅ OSs atribuídas para o técnico';
        
        -- Pegar uma OS do técnico
        SELECT id INTO test_os_id
        FROM ordens_servico 
        WHERE tecnico_id = tecnico_id_real
        LIMIT 1;
        
        IF test_os_id IS NOT NULL THEN
            -- Garantir valor de serviço
            UPDATE ordens_servico 
            SET valor_servico = 250.00
            WHERE id = test_os_id;
            
            -- Contar comissões antes
            SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
            RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
            
            -- Testar trigger
            UPDATE ordens_servico 
            SET status = 'ENTREGUE' 
            WHERE id = test_os_id;
            
            RAISE NOTICE '🔧 Status alterado para ENTREGUE na OS: %', test_os_id;
            
            -- Aguardar
            PERFORM pg_sleep(2);
            
            -- Contar depois
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
    ELSE
        RAISE NOTICE '❌ Nenhum técnico encontrado';
    END IF;
END $$;

-- 6. Mostrar resultado final
SELECT 
  'RESULTADO FINAL' as info,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;

-- 7. Mostrar comissões detalhadas
SELECT 
  'COMISSÕES DETALHADAS' as info,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
LEFT JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 3;
