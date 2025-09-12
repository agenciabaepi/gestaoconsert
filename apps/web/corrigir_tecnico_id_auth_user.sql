-- =====================================================
-- CORRIGIR TECNICO_ID: DE AUTH_USER_ID PARA USUARIO.ID
-- =====================================================

-- 1. Ver o problema atual
SELECT 
  'PROBLEMA IDENTIFICADO' as info,
  'Os tecnico_id estão usando auth_user_id em vez de usuarios.id' as problema;

-- 2. Ver OSs que estão com auth_user_id em vez de usuarios.id
SELECT 
  'OSs COM AUTH_USER_ID' as problema,
  os.id as os_id,
  os.numero_os,
  os.tecnico_id as atual_tecnico_id,
  u.id as correto_usuario_id,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.auth_user_id
WHERE os.tecnico_id = u.auth_user_id;

-- 3. CORRIGIR: Atualizar tecnico_id para usar usuarios.id
UPDATE ordens_servico 
SET tecnico_id = usuarios.id
FROM usuarios 
WHERE ordens_servico.tecnico_id = usuarios.auth_user_id;

-- 4. Verificar se corrigiu
SELECT 
  'OSs CORRIGIDAS' as resultado,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa,
  u.comissao_percentual,
  COUNT(*) as total_os
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome, u.comissao_ativa, u.comissao_percentual;

-- 5. Testar o trigger agora
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    tecnico_nome TEXT;
    valor_servico NUMERIC;
BEGIN
    -- Pegar uma OS do Pedro (agora com ID correto)
    SELECT 
      os.id,
      u.nome,
      COALESCE(os.valor_servico, 0)
    INTO test_os_id, tecnico_nome, valor_servico
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome = 'Pedro Oliveira'
      AND u.comissao_ativa = true
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        -- Se valor_servico for 0, vamos colocar um valor para teste
        IF valor_servico = 0 THEN
            UPDATE ordens_servico 
            SET valor_servico = 100.00
            WHERE id = test_os_id;
            valor_servico := 100.00;
        END IF;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE '🔧 Testando com OS: % do técnico: %', test_os_id, tecnico_nome;
        RAISE NOTICE '💰 Valor do serviço: R$ %', valor_servico;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Forçar trigger mudando status para ENTREGUE
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        -- Aguardar um pouquinho
        PERFORM pg_sleep(1);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou! Nova comissão calculada!';
            
            -- Mostrar a comissão criada
            SELECT 
              'NOVA COMISSÃO: R$ ' || valor_comissao || ' (OS: ' || ordem_servico_id || ')'
            FROM comissoes_historico 
            WHERE ordem_servico_id = test_os_id;
            
        ELSE
            RAISE NOTICE '❌ Trigger ainda não funcionou...';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhuma OS do Pedro encontrada';
    END IF;
END $$;

-- 6. Mostrar todas as comissões calculadas
SELECT 
  'COMISSÕES FINAIS' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.ordem_servico_id,
  ch.valor_comissao,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC;
