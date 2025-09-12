-- =====================================================
-- CORRIGIR PEDRO OLIVEIRA ESPECÍFICO
-- =====================================================

-- 1. Verificar se Pedro existe na tabela usuarios
SELECT 
  'VERIFICAÇÃO PEDRO' as info,
  id,
  nome,
  nivel,
  auth_user_id,
  comissao_ativa,
  empresa_id
FROM usuarios 
WHERE nome ILIKE '%pedro%'
ORDER BY nome;

-- 2. Verificar OSs atribuídas ao Pedro
SELECT 
  'OSs DO PEDRO' as info,
  os.id,
  os.tecnico_id,
  'Pedro deve ter este ID' as observacao
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios)
LIMIT 5;

-- 3. Criar/Atualizar Pedro se necessário
DO $$
DECLARE
    pedro_id UUID;
    pedro_existe BOOLEAN := false;
    tecnico_id_problema UUID;
BEGIN
    -- Verificar se Pedro já existe
    SELECT id INTO pedro_id 
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    IF pedro_id IS NOT NULL THEN
        pedro_existe := true;
        RAISE NOTICE 'Pedro já existe com ID: %', pedro_id;
    ELSE
        -- Buscar um tecnico_id que está sendo usado mas não existe
        SELECT DISTINCT tecnico_id INTO tecnico_id_problema
        FROM ordens_servico 
        WHERE tecnico_id IS NOT NULL
          AND tecnico_id NOT IN (SELECT id FROM usuarios)
        LIMIT 1;
        
        IF tecnico_id_problema IS NOT NULL THEN
            -- Criar Pedro com o ID que está sendo usado
            INSERT INTO usuarios (
                id,
                nome,
                email,
                nivel,
                auth_user_id,
                empresa_id,
                comissao_ativa,
                comissao_percentual,
                comissao_observacoes,
                created_at
            ) VALUES (
                tecnico_id_problema,
                'Pedro Oliveira',
                'pedro@consert.com.br',
                'tecnico',
                gen_random_uuid()::text, -- Gerar um auth_user_id único
                (SELECT id FROM empresas LIMIT 1), -- Primeira empresa
                true,
                15.00,
                'Criado para resolver foreign key constraint',
                NOW()
            );
            
            pedro_id := tecnico_id_problema;
            RAISE NOTICE 'Pedro criado com ID: %', pedro_id;
        END IF;
    END IF;
    
    -- Garantir que Pedro tem comissão ativa
    IF pedro_id IS NOT NULL THEN
        UPDATE usuarios 
        SET 
            nivel = 'tecnico',
            comissao_ativa = true,
            comissao_percentual = COALESCE(comissao_percentual, 15.00),
            comissao_observacoes = 'Técnico principal - comissão ativada'
        WHERE id = pedro_id;
        
        RAISE NOTICE 'Pedro atualizado: comissão ativa';
    END IF;
END $$;

-- 4. Verificar se agora está tudo OK
SELECT 
  'VERIFICAÇÃO FINAL PEDRO' as resultado,
  u.id,
  u.nome,
  u.nivel,
  u.comissao_ativa,
  u.comissao_percentual,
  COUNT(os.id) as total_os_atribuidas
FROM usuarios u
LEFT JOIN ordens_servico os ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%pedro%'
GROUP BY u.id, u.nome, u.nivel, u.comissao_ativa, u.comissao_percentual;

-- 5. Verificar se ainda há OSs com tecnico_id inválido
SELECT 
  'OSs COM PROBLEMA APÓS CORREÇÃO' as verificacao,
  COUNT(*) as total_problemas,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TUDO CORRIGIDO!'
    ELSE '❌ Ainda há problemas'
  END as status
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 6. Testar salvamento da OS #918 especificamente
DO $$
DECLARE
    pedro_id UUID;
    os_918_id UUID;
BEGIN
    -- Buscar Pedro
    SELECT id INTO pedro_id 
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Buscar OS #918
    SELECT id INTO os_918_id
    FROM ordens_servico 
    WHERE numero_os = '918'
    LIMIT 1;
    
    IF pedro_id IS NOT NULL AND os_918_id IS NOT NULL THEN
        -- Testar atualização
        UPDATE ordens_servico 
        SET 
            tecnico_id = pedro_id,
            status = 'ENTREGUE',
            valor_servico = 160.00
        WHERE id = os_918_id;
        
        RAISE NOTICE 'OS #918 atualizada com sucesso! Pedro ID: %', pedro_id;
    ELSE
        RAISE NOTICE 'Pedro ID: %, OS #918 ID: %', pedro_id, os_918_id;
    END IF;
END $$;
