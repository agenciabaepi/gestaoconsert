-- =====================================================
-- CORRIGIR MAPEAMENTO AUTH_USER_ID -> USUARIOS.ID
-- =====================================================

-- 1. Mostrar o problema atual
SELECT 
  'PROBLEMA ATUAL' as info,
  'auth_user_id sendo usado como tecnico_id' as descricao,
  COUNT(*) as total_os_com_problema
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 2. Mostrar mapeamento auth_user_id -> usuarios.id
SELECT 
  'MAPEAMENTO CORRETO' as info,
  u.auth_user_id as auth_user_id_supabase,
  u.id as usuarios_id_correto,
  u.nome,
  u.nivel
FROM usuarios u
WHERE u.auth_user_id IS NOT NULL
ORDER BY u.nome;

-- 3. Verificar quais auth_user_id estão sendo usados como tecnico_id
SELECT 
  'AUTH_USER_IDs USADOS COMO TECNICO_ID' as problema,
  os.tecnico_id as auth_user_id_incorreto,
  u.nome as nome_tecnico,
  u.id as usuarios_id_correto,
  COUNT(*) as total_os
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.auth_user_id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome, u.id
ORDER BY total_os DESC;

-- 4. CORRIGIR: Mapear auth_user_id para usuarios.id
UPDATE ordens_servico 
SET tecnico_id = u.id
FROM usuarios u 
WHERE ordens_servico.tecnico_id = u.auth_user_id;

-- 5. Verificar quantas OSs foram corrigidas
SELECT 
  'CORREÇÃO REALIZADA' as resultado,
  COUNT(*) as os_corrigidas
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL;

-- 6. Ativar comissões para todos os técnicos
UPDATE usuarios 
SET 
  comissao_ativa = true,
  comissao_percentual = CASE 
    WHEN comissao_percentual IS NULL OR comissao_percentual = 0 THEN 15.00 
    ELSE comissao_percentual 
  END,
  comissao_observacoes = COALESCE(comissao_observacoes, 'Comissão ativada automaticamente')
WHERE nivel = 'tecnico' OR auth_user_id IN (
  SELECT DISTINCT tecnico_id FROM ordens_servico WHERE tecnico_id IS NOT NULL
);

-- 7. Se não há técnicos, promover usuários que têm OSs
DO $$
DECLARE
    usuario_rec RECORD;
BEGIN
    -- Promover usuários que têm OSs para técnicos
    FOR usuario_rec IN 
        SELECT DISTINCT u.id, u.nome, u.nivel
        FROM usuarios u
        JOIN ordens_servico os ON os.tecnico_id = u.id
        WHERE u.nivel != 'tecnico'
    LOOP
        UPDATE usuarios 
        SET 
          nivel = 'tecnico',
          comissao_ativa = true,
          comissao_percentual = 15.00,
          comissao_observacoes = 'Promovido para técnico - tinha OSs atribuídas'
        WHERE id = usuario_rec.id;
        
        RAISE NOTICE 'Usuário % promovido para técnico', usuario_rec.nome;
    END LOOP;
END $$;

-- 8. Mostrar técnicos após correção
SELECT 
  'TÉCNICOS APÓS CORREÇÃO' as resultado,
  u.id,
  u.nome,
  u.nivel,
  u.comissao_ativa,
  u.comissao_percentual,
  COUNT(os.id) as total_os
FROM usuarios u
LEFT JOIN ordens_servico os ON os.tecnico_id = u.id
WHERE u.nivel = 'tecnico' OR u.comissao_ativa = true
GROUP BY u.id, u.nome, u.nivel, u.comissao_ativa, u.comissao_percentual
ORDER BY total_os DESC;

-- 9. Verificar se ainda há OSs com tecnico_id inválido
SELECT 
  'VERIFICAÇÃO FINAL' as info,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCESSO: Todas as OSs têm tecnico_id válido!'
    ELSE 'ERRO: Ainda há OSs com tecnico_id inválido'
  END as status,
  COUNT(*) as os_com_problema
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 10. TESTAR TRIGGER com dados corrigidos
DO $$
DECLARE
    os_para_teste UUID;
    tecnico_teste UUID;
    tecnico_nome TEXT;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar um técnico com OSs
    SELECT u.id, u.nome INTO tecnico_teste, tecnico_nome
    FROM usuarios u
    JOIN ordens_servico os ON os.tecnico_id = u.id
    WHERE u.comissao_ativa = true
    GROUP BY u.id, u.nome
    HAVING COUNT(os.id) > 0
    LIMIT 1;
    
    -- Pegar uma OS deste técnico que não seja ENTREGUE
    SELECT id INTO os_para_teste
    FROM ordens_servico 
    WHERE tecnico_id = tecnico_teste 
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_para_teste IS NOT NULL AND tecnico_teste IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        -- Garantir que tem valor de serviço
        UPDATE ordens_servico 
        SET 
          valor_servico = 500.00,
          tipo = 'manutencao' -- não é retorno
        WHERE id = os_para_teste;
        
        RAISE NOTICE '🔧 Testando trigger:';
        RAISE NOTICE '  - OS: %', os_para_teste;
        RAISE NOTICE '  - Técnico: % (%)', tecnico_nome, tecnico_teste;
        RAISE NOTICE '  - Comissões antes: %', comissoes_antes;
        
        -- Marcar como ENTREGUE para disparar trigger
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_para_teste;
        
        -- Aguardar um pouco
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE '  - Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Sistema de comissões funcionando!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou. Verificar função/trigger.';
        END IF;
    ELSE
        RAISE NOTICE '❌ Não foi possível encontrar OS/técnico para teste';
    END IF;
END $$;

-- 11. Mostrar comissões calculadas
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 10;
