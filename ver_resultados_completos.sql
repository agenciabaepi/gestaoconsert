-- =====================================================
-- VER RESULTADOS COMPLETOS
-- =====================================================

-- 1. Contar comissões
SELECT 'TOTAL COMISSOES' as info, COUNT(*) as total FROM comissoes_historico;

-- 2. Ver logs de erro mais recentes
SELECT 
  'ERROS RECENTES' as tipo,
  mensagem
FROM teste_trigger_log 
WHERE mensagem LIKE '%ERRO%' 
   OR mensagem LIKE '%MANUAL%'
ORDER BY timestamp DESC 
LIMIT 10;

-- 3. Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 4. Ver dados da OS 921
SELECT 
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id,
  cliente_id
FROM ordens_servico 
WHERE numero_os = '921';
