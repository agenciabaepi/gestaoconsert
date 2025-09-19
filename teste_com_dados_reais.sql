-- =====================================================
-- TESTE COM DADOS REAIS QUE JÁ EXISTEM
-- =====================================================

-- 1. Ver usuários que realmente existem
SELECT 
  'USUÁRIOS REAIS' as info,
  id,
  nome,
  nivel,
  auth_user_id
FROM usuarios 
LIMIT 3;

-- 2. Se existe algum usuário, transformar o primeiro em técnico
UPDATE usuarios 
SET 
  nivel = 'tecnico',
  comissao_ativa = true,
  comissao_percentual = 20.00,
  comissao_observacoes = 'Ativado para teste'
WHERE id = (SELECT id FROM usuarios LIMIT 1);

-- 3. Ver o técnico que vamos usar
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

-- 4. Criar OS simples para este técnico
INSERT INTO ordens_servico (
  id,
  empresa_id,
  cliente_id,
  tecnico_id,
  status,
  created_at,
  numero_os,
  valor_servico,
  categoria,
  marca,
  modelo,
  relato
)
SELECT 
  gen_random_uuid(),
  (SELECT empresa_id FROM usuarios LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios WHERE nivel = 'tecnico' LIMIT 1),
  'APROVADO',
  NOW(),
  999998,
  500.00,
  'TESTE COMISSAO',
  'TESTE',
  'TESTE',
  'OS para teste de comissão automática'
WHERE EXISTS (SELECT 1 FROM usuarios WHERE nivel = 'tecnico')
  AND EXISTS (SELECT 1 FROM clientes)
ON CONFLICT (numero_os) DO NOTHING;

-- 5. Ver a OS criada
SELECT 
  'OS CRIADA' as info,
  os.id,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome,
  os.status,
  os.valor_servico
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.numero_os = 999998;

-- 6. Verificar comissões antes
SELECT 
  'COMISSÕES ANTES' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 7. DISPARAR TRIGGER: Alterar status para ENTREGUE
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = 999998;

-- 8. Aguardar
SELECT pg_sleep(2);

-- 9. Verificar comissões depois
SELECT 
  'COMISSÕES DEPOIS' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 10. Ver detalhes da comissão criada (se criou)
SELECT 
  'DETALHES DA COMISSÃO' as resultado,
  ch.*,
  u.nome as tecnico_nome
FROM comissoes_historico ch
LEFT JOIN usuarios u ON ch.tecnico_id = u.id
WHERE ch.ordem_servico_id IN (
  SELECT id FROM ordens_servico WHERE numero_os = 999998
);

-- 11. Se não funcionou, verificar se trigger existe
SELECT 
  'STATUS DO TRIGGER' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 12. Verificar se função existe
SELECT 
  'STATUS DA FUNÇÃO' as info,
  routine_name
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 13. Teste manual da função (se existir)
DO $$
DECLARE
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    test_os_id UUID;
BEGIN
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    SELECT id INTO test_os_id FROM ordens_servico WHERE numero_os = 999998;
    
    IF test_os_id IS NOT NULL THEN
        RAISE NOTICE 'Testando função manual com OS: %', test_os_id;
        
        BEGIN
            PERFORM calcular_comissao_entrega();
            RAISE NOTICE 'Função executada sem erro';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro na função: %', SQLERRM;
        END;
        
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE 'SUCESSO! Função manual criou comissão!';
        ELSE
            RAISE NOTICE 'Função manual não criou comissão';
        END IF;
    END IF;
END $$;

-- 14. Limpar teste
DELETE FROM ordens_servico WHERE numero_os = 999998;
