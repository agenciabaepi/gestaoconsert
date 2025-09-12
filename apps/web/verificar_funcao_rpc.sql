-- =====================================================
-- VERIFICAR FUNÇÃO RPC
-- =====================================================

-- 1. Verificar se a função existe
SELECT 
  'FUNCAO RPC' as info,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'buscar_comissoes_tecnico';

-- 2. Testar a função diretamente
SELECT 'TESTE DIRETO RPC' as teste, * 
FROM buscar_comissoes_tecnico('2f17436e-f57a-4c17-8efc-672ad7e85530') 
LIMIT 5;

-- 3. Verificar permissões da função
SELECT 
  'PERMISSOES RPC' as info,
  proname as nome,
  proacl as permissoes,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'buscar_comissoes_tecnico';
