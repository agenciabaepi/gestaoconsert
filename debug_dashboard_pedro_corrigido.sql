-- =====================================================
-- DEBUG DASHBOARD PEDRO CORRIGIDO
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

-- 3. Buscar comissões com conversão correta de tipos
-- Busca por usuarios.id (UUID = UUID)
SELECT 
  'BUSCA POR USUARIO_ID' as tipo,
  COUNT(*) as total,
  COALESCE(SUM(valor_comissao), 0) as total_valor
FROM comissoes_historico ch
WHERE EXISTS (
  SELECT 1 FROM usuarios u 
  WHERE u.nome ILIKE '%pedro%' 
  AND u.id = ch.tecnico_id
);

-- Busca por auth_user_id (UUID = TEXT convertido)
SELECT 
  'BUSCA POR AUTH_USER_ID' as tipo,
  COUNT(*) as total,
  COALESCE(SUM(valor_comissao), 0) as total_valor
FROM comissoes_historico ch
WHERE EXISTS (
  SELECT 1 FROM usuarios u 
  WHERE u.nome ILIKE '%pedro%' 
  AND u.auth_user_id = ch.tecnico_id::text
);

-- Busca por tecnico_id (UUID = TEXT convertido)
SELECT 
  'BUSCA POR TECNICO_ID' as tipo,
  COUNT(*) as total,
  COALESCE(SUM(valor_comissao), 0) as total_valor
FROM comissoes_historico ch
WHERE EXISTS (
  SELECT 1 FROM usuarios u 
  WHERE u.nome ILIKE '%pedro%' 
  AND u.tecnico_id = ch.tecnico_id::text
);

-- 4. Mostrar o mapeamento direto
SELECT 
  'MAPEAMENTO DIRETO' as info,
  u.nome,
  u.id as usuario_id,
  u.auth_user_id,
  u.tecnico_id,
  '1102c335-5991-43f2-858e-ed130d69edc1' as comissao_tecnico_id,
  CASE 
    WHEN u.id::text = '1102c335-5991-43f2-858e-ed130d69edc1' THEN 'MATCH usuario.id'
    WHEN u.auth_user_id = '1102c335-5991-43f2-858e-ed130d69edc1' THEN 'MATCH auth_user_id'
    WHEN u.tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1' THEN 'MATCH tecnico_id'
    ELSE 'NO MATCH'
  END as resultado_match
FROM usuarios u
WHERE u.nome ILIKE '%pedro%';
