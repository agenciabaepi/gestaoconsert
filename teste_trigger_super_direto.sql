-- =====================================================
-- TESTE SUPER DIRETO DO TRIGGER
-- =====================================================

-- 1. Criar um usuário técnico temporário para teste
INSERT INTO usuarios (
  id,
  auth_user_id,
  empresa_id,
  nome,
  email,
  whatsapp,
  tipo,
  created_at,
  nivel,
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
  (SELECT id FROM empresas LIMIT 1),
  'Técnico Teste',
  'tecnico.teste@teste.com',
  '11999999999',
  'principal',
  NOW(),
  'tecnico',
  '12345678901',
  '',
  '{"bancada","dashboard"}',
  'tecnico_teste',
  15.00,
  true,
  'Criado para teste de comissões'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ver o técnico criado
SELECT 
  'TÉCNICO TESTE CRIADO' as info,
  id,
  nome,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome = 'Técnico Teste';

-- 3. Criar uma OS de teste
INSERT INTO ordens_servico (
  id,
  empresa_id,
  cliente_id,
  tecnico_id,
  status,
  created_at,
  atendente,
  tecnico,
  categoria,
  marca,
  modelo,
  relato,
  numero_os,
  valor_servico,
  status_tecnico
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM empresas LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios WHERE nome = 'Técnico Teste'),
  'APROVADO',
  NOW(),
  'TESTE ADMIN',
  'Técnico Teste',
  'TESTE',
  'TESTE',
  'TESTE',
  'OS CRIADA PARA TESTE DE COMISSÃO',
  999999,
  300.00,
  'APROVADO'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Ver a OS criada
SELECT 
  'OS TESTE CRIADA' as info,
  os.id,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome,
  os.status,
  os.valor_servico
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.numero_os = 999999;

-- 5. Contar comissões antes
SELECT 
  'ANTES DO TRIGGER' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 6. TESTAR TRIGGER: Mudar status para ENTREGUE
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = 999999;

-- 7. Aguardar e verificar
SELECT pg_sleep(1);

-- 8. Contar comissões depois
SELECT 
  'DEPOIS DO TRIGGER' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 9. Ver se comissão foi criada
SELECT 
  'COMISSÃO CRIADA' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
WHERE u.nome = 'Técnico Teste';

-- 10. Se não funcionou, testar função manual
DO $$
DECLARE
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'Tentando executar função manualmente...';
    
    BEGIN
        PERFORM calcular_comissao_entrega();
        RAISE NOTICE 'Função executada sem erro';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao executar função: %', SQLERRM;
    END;
    
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE 'Função manual funcionou!';
    ELSE
        RAISE NOTICE 'Função manual não criou comissões';
    END IF;
END $$;

-- 11. Limpar dados de teste
DELETE FROM ordens_servico WHERE numero_os = 999999;
DELETE FROM usuarios WHERE nome = 'Técnico Teste';
