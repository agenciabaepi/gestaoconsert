-- =====================================================
-- INVESTIGAR POR QUE AS COMISSÕES SUMIRAM
-- =====================================================

-- 1. Verificar se a tabela comissoes_historico existe
SELECT 
  'TABELA EXISTE?' as info,
  COUNT(*) as existe
FROM information_schema.tables 
WHERE table_name = 'comissoes_historico';

-- 2. Verificar estrutura da tabela
SELECT 
  'ESTRUTURA COMISSOES_HISTORICO' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 3. Verificar se há algum dado na tabela
SELECT 
  'DADOS NA TABELA' as info,
  COUNT(*) as total_registros
FROM comissoes_historico;

-- 4. Tentar ver se há logs de exclusão ou se a tabela foi recriada
-- (verificar se as colunas ainda são as mesmas)

-- 5. Verificar se há OSs ENTREGUE com técnico
SELECT 
  'OSs PARA TESTE' as info,
  COUNT(*) as total_os_entregue_com_tecnico
FROM ordens_servico 
WHERE status = 'ENTREGUE' 
  AND tecnico_id IS NOT NULL 
  AND valor_servico > 0;

-- 6. Ver detalhes de uma OS específica para testar
SELECT 
  'DETALHES OS PARA TESTE' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id
FROM ordens_servico 
WHERE status = 'ENTREGUE' 
  AND tecnico_id IS NOT NULL 
  AND valor_servico > 0
LIMIT 1;
