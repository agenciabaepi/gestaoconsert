-- =====================================================
-- VER DADOS PEDRO COMPLETOS
-- =====================================================

-- 1. Dados completos do Pedro
SELECT 
  'PEDRO COMPLETO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  nivel
FROM usuarios 
WHERE nome ILIKE '%pedro%'
ORDER BY created_at DESC;

-- 2. Todas as comissões com IDs completos
SELECT 
  'COMISSOES COMPLETAS' as info,
  id,
  tecnico_id,
  valor_comissao,
  data_entrega::date as data
FROM comissoes_historico
ORDER BY data_entrega DESC;
