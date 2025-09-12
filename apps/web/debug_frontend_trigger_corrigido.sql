-- =====================================================
-- DEBUG CORRIGIDO: POR QUE O FRONTEND NÃO DISPARA O TRIGGER?
-- =====================================================

-- 1. Verificar se o trigger ainda existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Ver OSs que foram marcadas como ENTREGUE recentemente (usando created_at)
SELECT 
  'OSs ENTREGUE RECENTES' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.tecnico_id,
  u.nome as tecnico_nome,
  os.created_at
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE'
ORDER BY os.created_at DESC
LIMIT 5;

-- 3. Verificar se há comissões para essas OSs
SELECT 
  'COMISSÕES DAS OSs RECENTES' as info,
  ch.id,
  ch.valor_comissao,
  ch.ordem_servico_id,
  ch.created_at,
  os.numero_os
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
ORDER BY ch.created_at DESC
LIMIT 5;

-- 4. Verificar total atual de comissões
SELECT 
  'TOTAL ATUAL' as info,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;

-- 5. Verificar estrutura da tabela ordens_servico
SELECT 
  'COLUNAS ORDENS_SERVICO' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
  AND column_name IN ('updated_at', 'created_at', 'status', 'tecnico_id', 'valor_servico')
ORDER BY column_name;
