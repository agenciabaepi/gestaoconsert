-- =====================================================
-- DEBUG DASHBOARD PEDRO
-- =====================================================

-- 1. Verificar dados do Pedro
SELECT 
  'DADOS PEDRO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  nivel
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 2. Verificar a comissão existente
SELECT 
  'COMISSAO EXISTENTE' as info,
  id,
  tecnico_id,
  valor_comissao,
  data_entrega
FROM comissoes_historico 
WHERE id = '71a12f5f-f659-4e3e-a7e1-b9bc1bca92b5';

-- 3. Verificar se o tecnico_id da comissão bate com algum do Pedro
SELECT 
  'MAPEAMENTO IDS' as info,
  u.id as usuario_id,
  u.auth_user_id,
  u.tecnico_id,
  ch.tecnico_id as comissao_tecnico_id,
  ch.valor_comissao
FROM usuarios u
CROSS JOIN comissoes_historico ch
WHERE u.nome ILIKE '%pedro%'
  AND ch.id = '71a12f5f-f659-4e3e-a7e1-b9bc1bca92b5';

-- 4. Buscar comissões com diferentes IDs do Pedro
SELECT 
  'BUSCA POR USUARIO_ID' as tipo,
  COUNT(*) as total,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
WHERE u.nome ILIKE '%pedro%';

SELECT 
  'BUSCA POR AUTH_USER_ID' as tipo,
  COUNT(*) as total,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id::text = u.auth_user_id
WHERE u.nome ILIKE '%pedro%';

SELECT 
  'BUSCA POR TECNICO_ID' as tipo,
  COUNT(*) as total,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id::text = u.tecnico_id
WHERE u.nome ILIKE '%pedro%';
