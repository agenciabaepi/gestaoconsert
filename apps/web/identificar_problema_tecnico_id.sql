-- =====================================================
-- IDENTIFICAR E CORRIGIR PROBLEMA TECNICO_ID
-- =====================================================

-- 1. Ver qual tecnico_id está causando problema
SELECT 
  'TECNICO_ID PROBLEMÁTICO' as info,
  os.tecnico_id,
  COUNT(*) as total_os,
  'Este ID não existe na tabela usuarios' as problema
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios)
GROUP BY os.tecnico_id
ORDER BY total_os DESC;

-- 2. Ver todos os usuários válidos
SELECT 
  'USUÁRIOS VÁLIDOS' as info,
  id,
  nome,
  nivel,
  email
FROM usuarios
ORDER BY nivel, nome;

-- 3. Mostrar OSs com problema específico
SELECT 
  'OSs COM PROBLEMA' as info,
  id as os_id,
  tecnico_id as tecnico_id_invalido,
  status,
  cliente,
  created_at
FROM ordens_servico 
WHERE tecnico_id = 'c7f16254-fce9-49cd-9956-2189b0de53c7'
ORDER BY created_at DESC
LIMIT 10;

-- 4. CORRIGIR: Primeiro limpar tecnico_id inválidos
UPDATE ordens_servico 
SET tecnico_id = NULL
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 5. Verificar quantas OSs ficaram sem técnico
SELECT 
  'OSs SEM TÉCNICO APÓS LIMPEZA' as resultado,
  COUNT(*) as total
FROM ordens_servico 
WHERE tecnico_id IS NULL;

-- 6. Pegar primeiro usuário disponível para ser técnico
DO $$
DECLARE
    primeiro_usuario UUID;
    usuario_nome TEXT;
    total_tecnicos INTEGER;
BEGIN
    -- Ver quantos técnicos existem
    SELECT COUNT(*) INTO total_tecnicos FROM usuarios WHERE nivel = 'tecnico';
    
    IF total_tecnicos = 0 THEN
        -- Se não há técnicos, pegar primeiro usuário
        SELECT id, nome INTO primeiro_usuario, usuario_nome 
        FROM usuarios 
        ORDER BY created_at 
        LIMIT 1;
        
        -- Transformar em técnico
        UPDATE usuarios 
        SET 
            nivel = 'tecnico',
            comissao_ativa = true,
            comissao_percentual = 15.00
        WHERE id = primeiro_usuario;
        
        RAISE NOTICE 'Usuário % transformado em técnico', usuario_nome;
    ELSE
        -- Se já há técnicos, apenas ativar comissão
        UPDATE usuarios 
        SET 
            comissao_ativa = true,
            comissao_percentual = COALESCE(comissao_percentual, 15.00)
        WHERE nivel = 'tecnico';
        
        RAISE NOTICE 'Comissões ativadas para % técnicos', total_tecnicos;
    END IF;
END $$;

-- 7. Mostrar técnicos após correção
SELECT 
  'TÉCNICOS DISPONÍVEIS' as resultado,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 8. Atribuir algumas OSs para o técnico (apenas para teste)
DO $$
DECLARE
    tecnico_principal UUID;
    tecnico_nome TEXT;
    os_atribuidas INTEGER;
BEGIN
    -- Pegar primeiro técnico
    SELECT id, nome INTO tecnico_principal, tecnico_nome
    FROM usuarios 
    WHERE nivel = 'tecnico'
    ORDER BY nome
    LIMIT 1;
    
    IF tecnico_principal IS NOT NULL THEN
        -- Atribuir apenas 3 OSs para teste
        UPDATE ordens_servico 
        SET tecnico_id = tecnico_principal
        WHERE tecnico_id IS NULL
          AND id IN (
            SELECT id FROM ordens_servico 
            WHERE tecnico_id IS NULL 
            ORDER BY created_at DESC 
            LIMIT 3
          );
        
        GET DIAGNOSTICS os_atribuidas = ROW_COUNT;
        RAISE NOTICE '% OSs atribuídas para técnico %', os_atribuidas, tecnico_nome;
    END IF;
END $$;

-- 9. Verificar resultado final
SELECT 
  'VERIFICAÇÃO FINAL' as info,
  (SELECT COUNT(*) FROM usuarios WHERE nivel = 'tecnico') as total_tecnicos,
  (SELECT COUNT(*) FROM ordens_servico WHERE tecnico_id IS NOT NULL) as os_com_tecnico,
  (SELECT COUNT(*) FROM ordens_servico WHERE tecnico_id IS NULL) as os_sem_tecnico;

-- 10. Mostrar OSs com técnico válido
SELECT 
  'OSs COM TÉCNICO VÁLIDO' as resultado,
  os.id as os_id,
  os.tecnico_id,
  u.nome as tecnico_nome,
  os.status,
  os.valor_servico
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
ORDER BY os.created_at DESC
LIMIT 5;
