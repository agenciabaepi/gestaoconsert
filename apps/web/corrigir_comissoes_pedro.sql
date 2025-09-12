-- =====================================================
-- CORRIGIR COMISSÕES DO PEDRO
-- =====================================================

-- 1. Ativar comissão do Pedro Oliveira
UPDATE usuarios 
SET 
  comissao_percentual = 10.00,
  comissao_ativa = true,
  comissao_observacoes = 'Comissão ativada - 10% sobre serviços'
WHERE nome ILIKE '%Pedro%' AND nivel = 'tecnico';

-- 2. Verificar se foi ativado
SELECT 
  'COMISSÃO ATIVADA' as status,
  nome,
  comissao_percentual,
  comissao_ativa
FROM usuarios 
WHERE nome ILIKE '%Pedro%';

-- 3. Forçar recálculo das OSs existentes que estão ENTREGUE
-- Primeiro muda para outro status
UPDATE ordens_servico 
SET status = 'CONCLUIDO' 
WHERE status = 'ENTREGUE' 
  AND tecnico_id IS NOT NULL;

-- 4. Agora volta para ENTREGUE (isso vai disparar o trigger)
UPDATE ordens_servico 
SET status = 'ENTREGUE' 
WHERE status = 'CONCLUIDO' 
  AND tecnico_id IS NOT NULL;

-- 5. Verificar se as comissões foram calculadas
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico;

-- 6. Ver detalhes das comissões do Pedro
SELECT 
  'DETALHES PEDRO' as info,
  ch.id,
  ch.valor_comissao,
  os.numero_os,
  os.valor_servico,
  ch.data_calculo,
  u.nome as tecnico_nome
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
JOIN usuarios u ON ch.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%'
ORDER BY ch.data_calculo DESC;
