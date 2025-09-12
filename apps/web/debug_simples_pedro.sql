-- =====================================================
-- DEBUG SIMPLES PEDRO
-- =====================================================

-- 1. Dados do Pedro
SELECT 
  'PEDRO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  nivel
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 2. Comissão existente
SELECT 
  'COMISSAO' as info,
  tecnico_id,
  valor_comissao,
  data_entrega
FROM comissoes_historico 
WHERE id = '71a12f5f-f659-4e3e-a7e1-b9bc1bca92b5';

-- 3. Teste simples - buscar comissões pelo ID exato da comissão
SELECT 
  'TESTE ID EXATO' as teste,
  COUNT(*) as total
FROM comissoes_historico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 4. Todas as comissões (para ver se há outras)
SELECT 
  'TODAS COMISSOES' as info,
  COUNT(*) as total,
  array_agg(DISTINCT tecnico_id) as tecnicos_ids
FROM comissoes_historico;
