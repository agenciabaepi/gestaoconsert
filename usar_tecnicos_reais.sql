-- =====================================================
-- USAR TÉCNICOS REAIS EXISTENTES
-- =====================================================

-- 1. Primeiro, vamos ver TODOS os usuários reais
SELECT 
  'TODOS OS USUÁRIOS REAIS' as info,
  id,
  nome,
  email,
  nivel,
  auth_user_id,
  CASE WHEN comissao_ativa IS NOT NULL THEN comissao_ativa ELSE false END as comissao_ativa
FROM usuarios 
ORDER BY nivel, nome;

-- 2. Identificar quem pode ser técnico
SELECT 
  'POSSÍVEIS TÉCNICOS' as info,
  id,
  nome,
  nivel,
  email
FROM usuarios 
WHERE nivel IN ('tecnico', 'admin', 'atendente') -- qualquer um pode virar técnico
ORDER BY 
  CASE WHEN nivel = 'tecnico' THEN 1 ELSE 2 END,
  nome;

-- 3. Transformar o primeiro usuário em técnico (se não há técnicos)
DO $$
DECLARE
    usuario_para_tecnico UUID;
    usuario_nome TEXT;
    total_tecnicos INTEGER;
BEGIN
    -- Verificar quantos técnicos existem
    SELECT COUNT(*) INTO total_tecnicos FROM usuarios WHERE nivel = 'tecnico';
    
    IF total_tecnicos = 0 THEN
        -- Se não há técnicos, transformar o primeiro usuário
        SELECT id, nome INTO usuario_para_tecnico, usuario_nome 
        FROM usuarios 
        ORDER BY created_at 
        LIMIT 1;
        
        IF usuario_para_tecnico IS NOT NULL THEN
            UPDATE usuarios 
            SET 
                nivel = 'tecnico',
                comissao_ativa = true,
                comissao_percentual = 15.00,
                comissao_observacoes = 'Convertido para técnico automaticamente'
            WHERE id = usuario_para_tecnico;
            
            RAISE NOTICE 'Usuário % (%) convertido para técnico', usuario_nome, usuario_para_tecnico;
        END IF;
    ELSE
        -- Se já há técnicos, apenas ativar comissão
        UPDATE usuarios 
        SET 
            comissao_ativa = true,
            comissao_percentual = COALESCE(comissao_percentual, 15.00),
            comissao_observacoes = COALESCE(comissao_observacoes, 'Comissão ativada automaticamente')
        WHERE nivel = 'tecnico';
        
        RAISE NOTICE 'Comissões ativadas para % técnicos existentes', total_tecnicos;
    END IF;
END $$;

-- 4. Verificar técnicos após ajustes
SELECT 
  'TÉCNICOS APÓS AJUSTES' as resultado,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 5. Corrigir OSs órfãs usando o primeiro técnico disponível
DO $$
DECLARE
    tecnico_principal UUID;
    tecnico_nome TEXT;
    os_corrigidas INTEGER;
BEGIN
    -- Pegar o primeiro técnico com comissão ativa
    SELECT id, nome INTO tecnico_principal, tecnico_nome
    FROM usuarios 
    WHERE nivel = 'tecnico' AND comissao_ativa = true
    ORDER BY nome
    LIMIT 1;
    
    IF tecnico_principal IS NOT NULL THEN
        -- Corrigir OSs com tecnico_id inválido
        UPDATE ordens_servico 
        SET tecnico_id = tecnico_principal
        WHERE tecnico_id IS NOT NULL 
          AND tecnico_id NOT IN (SELECT id FROM usuarios);
        
        GET DIAGNOSTICS os_corrigidas = ROW_COUNT;
        
        -- Atribuir OSs sem técnico (apenas algumas para teste)
        UPDATE ordens_servico 
        SET tecnico_id = tecnico_principal
        WHERE tecnico_id IS NULL
          AND id IN (
            SELECT id FROM ordens_servico 
            WHERE tecnico_id IS NULL 
            ORDER BY created_at DESC 
            LIMIT 3
          );
        
        RAISE NOTICE 'OSs corrigidas: %, usando técnico: % (%)', os_corrigidas, tecnico_nome, tecnico_principal;
    ELSE
        RAISE NOTICE 'Nenhum técnico encontrado!';
    END IF;
END $$;

-- 6. Verificar OSs após correção
SELECT 
  'OSs APÓS CORREÇÃO' as resultado,
  os.tecnico_id,
  u.nome as tecnico_nome,
  COUNT(*) as total_os,
  string_agg(DISTINCT os.status, ', ') as status_diferentes
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome
ORDER BY total_os DESC;

-- 7. TESTAR TRIGGER com OS real
DO $$
DECLARE
    os_para_teste UUID;
    tecnico_teste UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    tecnico_nome TEXT;
BEGIN
    -- Pegar um técnico ativo
    SELECT id, nome INTO tecnico_teste, tecnico_nome
    FROM usuarios 
    WHERE nivel = 'tecnico' AND comissao_ativa = true
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
        SET valor_servico = 450.00
        WHERE id = os_para_teste;
        
        RAISE NOTICE '🔧 Testando: OS % do técnico % (%)', os_para_teste, tecnico_nome, tecnico_teste;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Marcar como ENTREGUE para disparar trigger
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_para_teste;
        
        -- Aguardar trigger
        PERFORM pg_sleep(3);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Sistema funcionando com técnicos reais!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou ainda';
        END IF;
    ELSE
        RAISE NOTICE '❌ Não foi possível encontrar OS/técnico para teste';
    END IF;
END $$;

-- 8. Mostrar resultado final
SELECT 
  'RESULTADO FINAL' as info,
  (SELECT COUNT(*) FROM usuarios WHERE nivel = 'tecnico' AND comissao_ativa = true) as tecnicos_ativos,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COALESCE(SUM(valor_comissao), 0) FROM comissoes_historico) as valor_total_comissoes;

-- 9. Listar comissões calculadas
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
ORDER BY ch.created_at DESC;
