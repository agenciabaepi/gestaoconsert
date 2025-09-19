-- =====================================================
-- VERIFICAR PEDRO LOGADO
-- =====================================================

-- 1. Ver qual Pedro está no sistema
SELECT 
  'USUARIOS PEDRO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  nivel,
  email
FROM usuarios 
WHERE nome ILIKE '%pedro%'
ORDER BY created_at;

-- 2. Ver as comissões existentes
SELECT 
  'COMISSOES EXISTENTES' as info,
  id,
  tecnico_id,
  valor_comissao,
  data_entrega,
  status
FROM comissoes_historico
ORDER BY data_entrega DESC;

-- 3. Testar se o Pedro logado tem comissões
-- Assumindo que o Pedro logado tem auth_user_id que aparece no console
SELECT 
  'TESTE BUSCA CONSOLE' as teste,
  COUNT(*) as total,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico 
WHERE tecnico_id::text = ANY(ARRAY[
  '2f17436e-f57a-4c17-8efc-672ad7e85530', -- ID que apareceu no console antes
  '1102c335-5991-43f2-858e-ed130d69edc1', -- ID da comissão que sabemos que existe
  'c7f16254-fce3-49cd-9956-2189b0de53c7'  -- Outro ID
]);
