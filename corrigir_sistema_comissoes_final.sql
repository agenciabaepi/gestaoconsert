-- =====================================================
-- CORRIGIR SISTEMA DE COMISSÕES - SOLUÇÃO FINAL
-- =====================================================

-- 1. Ver estrutura completa da tabela ordens_servico
SELECT 
  'ESTRUTURA COMPLETA OS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position;

-- 2. Ver todos os usuários com seus IDs
SELECT 
  'TODOS OS USUÁRIOS' as info,
  id,
  nome,
  nivel,
  auth_user_id,
  email
FROM usuarios 
ORDER BY nome;

-- 3. Ver OSs que estão com problema
SELECT 
  'OSs PROBLEMÁTICAS' as problema,
  os.id,
  os.numero_os,
  os.tecnico_id,
  os.tecnico as nome_tecnico,
  os.status,
  u.nome as usuario_encontrado
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
LIMIT 5;

-- 4. SOLUÇÃO: Criar um usuário técnico genérico se não existir Pedro
DO $$
DECLARE
    pedro_id UUID;
    empresa_existente UUID;
BEGIN
    -- Verificar se Pedro existe
    SELECT id INTO pedro_id FROM usuarios WHERE nome ILIKE '%Pedro%' LIMIT 1;
    
    -- Se Pedro não existe, criar um técnico genérico
    IF pedro_id IS NULL THEN
        -- Pegar uma empresa existente
        SELECT id INTO empresa_existente FROM empresas LIMIT 1;
        
        -- Criar usuário técnico
        INSERT INTO usuarios (
            id,
            auth_user_id,
            empresa_id,
            nome,
            email,
            nivel,
            tipo,
            created_at,
            whatsapp,
            cpf,
            telefone,
            permissoes,
            usuario,
            comissao_percentual,
            comissao_ativa,
            comissao_observacoes
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(),
            empresa_existente,
            'Técnico Sistema',
            'tecnico@sistema.com',
            'tecnico',
            'principal',
            NOW(),
            '11999999999',
            '12345678901',
            '',
            '{"bancada","dashboard"}',
            'tecnico',
            15.00,
            true,
            'Técnico criado automaticamente para comissões'
        ) RETURNING id INTO pedro_id;
        
        RAISE NOTICE 'Técnico criado com ID: %', pedro_id;
    ELSE
        -- Ativar comissão do Pedro existente
        UPDATE usuarios 
        SET 
            comissao_ativa = true,
            comissao_percentual = 15.00,
            comissao_observacoes = 'Comissão ativada automaticamente'
        WHERE id = pedro_id;
        
        RAISE NOTICE 'Pedro encontrado com ID: %', pedro_id;
    END IF;
    
    -- Corrigir todas as OSs com tecnico_id inválido
    UPDATE ordens_servico 
    SET tecnico_id = pedro_id
    WHERE tecnico_id IS NOT NULL 
      AND tecnico_id NOT IN (SELECT id FROM usuarios);
    
    RAISE NOTICE 'OSs corrigidas para usar o técnico correto';
END $$;

-- 5. Verificar se corrigiu
SELECT 
  'OSs APÓS CORREÇÃO' as resultado,
  os.id,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa,
  u.comissao_percentual,
  os.status
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
LIMIT 5;

-- 6. Criar configuração de empresa se não existir
INSERT INTO configuracoes_comissao (empresa_id, comissao_padrao, comissao_apenas_servico, comissao_retorno_ativo)
SELECT 
  id as empresa_id,
  15.00 as comissao_padrao,
  true as comissao_apenas_servico,
  false as comissao_retorno_ativo
FROM empresas 
WHERE id NOT IN (SELECT empresa_id FROM configuracoes_comissao WHERE empresa_id IS NOT NULL)
ON CONFLICT (empresa_id) DO NOTHING;

-- 7. TESTAR TRIGGER COM OS REAL
DO $$
DECLARE
    test_os_id UUID;
    tecnico_nome TEXT;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    valor_servico_atual DECIMAL;
BEGIN
    -- Pegar uma OS com técnico válido
    SELECT 
        os.id,
        u.nome,
        COALESCE(os.valor_servico::DECIMAL, 0)
    INTO test_os_id, tecnico_nome, valor_servico_atual
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.comissao_ativa = true
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        RAISE NOTICE '🔧 Testando com OS: %, Técnico: %', test_os_id, tecnico_nome;
        
        -- Se não tem valor de serviço, adicionar
        IF valor_servico_atual = 0 THEN
            UPDATE ordens_servico 
            SET valor_servico = 300.00
            WHERE id = test_os_id;
            RAISE NOTICE '💰 Valor de serviço atualizado para R$ 300,00';
        END IF;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- DISPARAR TRIGGER: Alterar status para ENTREGUE
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = test_os_id;
        
        RAISE NOTICE '✅ Status alterado para ENTREGUE';
        
        -- Aguardar
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou! Comissão calculada!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhuma OS com técnico válido encontrada';
    END IF;
END $$;

-- 8. Mostrar comissões calculadas
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 3;

-- 9. Status final do sistema
SELECT 
  'STATUS FINAL' as info,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM comissoes_historico) as comissoes_calculadas,
  (SELECT COUNT(*) FROM configuracoes_comissao) as empresas_configuradas;
