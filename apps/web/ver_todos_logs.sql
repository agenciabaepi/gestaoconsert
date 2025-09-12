-- =====================================================
-- VER TODOS OS LOGS PARA DIAGNÓSTICO
-- =====================================================

-- 1. Ver TODOS os logs da tabela de teste
SELECT 
  ROW_NUMBER() OVER (ORDER BY timestamp) as ordem,
  mensagem,
  timestamp
FROM teste_trigger_log 
ORDER BY timestamp;

-- 2. Verificar dados específicos da OS 921
SELECT 
  'DADOS OS 921 DETALHADOS' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id,
  cliente_id,
  created_at
FROM ordens_servico 
WHERE numero_os = '921';

-- 3. Verificar se tecnico_id é válido na tabela usuarios
SELECT 
  'TECNICO VALIDO' as info,
  u.id,
  u.nome,
  u.nivel,
  u.tecnico_id,
  u.auth_user_id
FROM usuarios u
WHERE u.id = (SELECT tecnico_id FROM ordens_servico WHERE numero_os = '921')
   OR u.tecnico_id = (SELECT tecnico_id FROM ordens_servico WHERE numero_os = '921')
   OR u.auth_user_id = (SELECT tecnico_id FROM ordens_servico WHERE numero_os = '921');

-- 4. Verificar constraints da tabela comissoes_historico
SELECT 
  'CONSTRAINTS' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'comissoes_historico';

-- 5. Verificar foreign keys específicas
SELECT 
  'FOREIGN KEYS' as info,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu 
  ON kcu.constraint_name = ccu.constraint_name
WHERE kcu.table_name = 'comissoes_historico'
  AND kcu.constraint_name IN (
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'comissoes_historico' 
    AND constraint_type = 'FOREIGN KEY'
  );

-- 6. Tentar inserção super simples com valores fixos conhecidos
DO $$
BEGIN
    BEGIN
        -- Inserção com dados mínimos obrigatórios
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega
        ) VALUES (
            '2f17436e-f57a-4c17-8efc-672ad7e85530', -- Pedro (UUID conhecido)
            (SELECT id FROM ordens_servico WHERE numero_os = '921'),
            100.00,
            10.00,
            10.00,
            NOW()
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT SIMPLES: Sucesso!');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT SIMPLES: ERRO - ' || SQLERRM);
    END;
END $$;

-- 7. Verificar se inserção simples funcionou
SELECT 'TESTE SIMPLES' as momento, COUNT(*) as total FROM comissoes_historico;

-- 8. Se ainda não funcionou, tentar sem foreign keys
DO $$
BEGIN
    BEGIN
        -- Criar um UUID temporário para teste
        INSERT INTO comissoes_historico (
            id,
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(), -- UUID fake
            gen_random_uuid(), -- UUID fake
            100.00,
            10.00,
            10.00,
            NOW()
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT SEM FK: Sucesso!');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT SEM FK: ERRO - ' || SQLERRM);
    END;
END $$;
