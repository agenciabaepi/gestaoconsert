-- =====================================================
-- DEBUG: IDENTIFICAR IDS DOS TÉCNICOS
-- =====================================================

-- 1. Listar todos os usuários e seus IDs
SELECT 
  'TODOS OS USUÁRIOS' as info,
  id,
  nome,
  email,
  nivel,
  auth_user_id
FROM usuarios 
ORDER BY nivel, nome;

-- 2. Identificar especificamente os técnicos
SELECT 
  'TÉCNICOS IDENTIFICADOS' as info,
  id as usuario_id,
  auth_user_id,
  nome,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 3. Ver qual ID está sendo usado nas OSs
SELECT 
  'TECNICO_IDS EM ORDENS' as info,
  tecnico_id,
  COUNT(*) as quantidade_os,
  string_agg(DISTINCT numero_os::text, ', ') as numeros_os
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL
GROUP BY tecnico_id
ORDER BY quantidade_os DESC;

-- 4. Verificar relação entre OSs e usuários
SELECT 
  'RELAÇÃO OS x USUÁRIO' as info,
  os.tecnico_id,
  u.nome as usuario_nome,
  u.nivel,
  COUNT(os.id) as total_os
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
GROUP BY os.tecnico_id, u.nome, u.nivel
ORDER BY total_os DESC;

-- 5. Criar um técnico de teste se necessário
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
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '660e8400-e29b-41d4-a716-446655440000'::uuid,
  id as empresa_id,
  'Técnico Teste Final',
  'tecnico.final@teste.com',
  'tecnico',
  'principal',
  NOW(),
  '11999999999',
  '99999999999',
  '',
  '{"bancada","dashboard"}',
  'tecnico_final',
  20.00,
  true,
  'Técnico criado para teste final do sistema'
FROM empresas 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 6. Verificar se foi criado
SELECT 
  'TÉCNICO TESTE CRIADO' as resultado,
  id,
  nome,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 7. Atualizar algumas OSs para usar este técnico
UPDATE ordens_servico 
SET tecnico_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE id IN (
  SELECT id FROM ordens_servico 
  WHERE status != 'ENTREGUE'
  LIMIT 2
);

-- 8. Mostrar resultado
SELECT 
  'OSs DO TÉCNICO TESTE' as resultado,
  os.id,
  os.numero_os,
  os.status,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id = '550e8400-e29b-41d4-a716-446655440000';

-- 9. Resumo final
SELECT 
  'RESUMO FINAL' as info,
  (SELECT COUNT(*) FROM usuarios WHERE nivel = 'tecnico') as total_tecnicos,
  (SELECT COUNT(*) FROM usuarios WHERE nivel = 'tecnico' AND comissao_ativa = true) as tecnicos_com_comissao,
  (SELECT COUNT(*) FROM ordens_servico WHERE tecnico_id IS NOT NULL) as os_com_tecnico,
  (SELECT COUNT(*) FROM ordens_servico WHERE tecnico_id IS NOT NULL AND tecnico_id IN (SELECT id FROM usuarios)) as os_com_tecnico_valido;
