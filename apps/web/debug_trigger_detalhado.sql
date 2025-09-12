-- =====================================================
-- DEBUG DETALHADO DO TRIGGER
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  'TRIGGER EXISTE?' as check_item,
  COUNT(*) as existe
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar se a função existe
SELECT 
  'FUNÇÃO EXISTE?' as check_item,
  COUNT(*) as existe
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Testar a função manualmente
SELECT 
  'TESTE MANUAL DA FUNÇÃO' as teste,
  'Vamos executar a função diretamente' as info;

-- Pegar uma OS do Pedro que está ENTREGUE
SELECT 
  'OS PARA TESTE' as info,
  id,
  numero_os,
  tecnico_id,
  valor_servico,
  status
FROM ordens_servico 
WHERE status = 'ENTREGUE' 
  AND tecnico_id IS NOT NULL 
LIMIT 1;

-- 4. Ver logs de erro (se houver)
SELECT 
  'ESTRUTURA TABELA COMISSOES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;
