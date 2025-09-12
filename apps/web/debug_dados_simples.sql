-- =====================================================
-- DEBUG DOS DADOS SIMPLES
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Ver todas as OSs ENTREGUE
SELECT 
  'OSs ENTREGUE' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.tecnico_id,
  u.nome as tecnico_nome
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE'
ORDER BY os.created_at DESC;

-- 3. Ver total de comissões
SELECT 
  'TOTAL COMISSÕES' as info,
  COUNT(*) as total,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;

-- 4. Ver detalhes das comissões existentes
SELECT 
  'DETALHES COMISSÕES' as info,
  ch.valor_comissao,
  os.numero_os,
  u.nome as tecnico_nome,
  ch.observacoes
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC;
