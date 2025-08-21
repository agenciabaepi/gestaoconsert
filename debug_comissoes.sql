-- =====================================================
-- DEBUG: POR QUE AS COMISSÕES NÃO ESTÃO SENDO CALCULADAS?
-- =====================================================

-- 1. Verificar se Pedro Oliveira tem comissão ativa
SELECT 
  'TÉCNICO PEDRO' as debug_item,
  nome,
  nivel,
  comissao_percentual,
  comissao_ativa,
  comissao_observacoes
FROM usuarios 
WHERE nome ILIKE '%Pedro%' OR nome ILIKE '%Oliveira%';

-- 2. Verificar OSs do Pedro
SELECT 
  'OSs DO PEDRO' as debug_item,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.valor_faturado,
  os.tecnico_id,
  u.nome as tecnico_nome
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%' OR u.nome ILIKE '%Oliveira%'
ORDER BY os.created_at DESC
LIMIT 10;

-- 3. Verificar se trigger existe e está funcionando
SELECT 
  'TRIGGER STATUS' as debug_item,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 4. Verificar se função existe
SELECT 
  'FUNÇÃO STATUS' as debug_item,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 5. Verificar todas as OSs ENTREGUE
SELECT 
  'OSs ENTREGUE' as debug_item,
  COUNT(*) as total_entregue
FROM ordens_servico 
WHERE status = 'ENTREGUE';

-- 6. Verificar comissões na tabela
SELECT 
  'COMISSÕES EXISTENTES' as debug_item,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 7. Verificar configurações da empresa
SELECT 
  'CONFIG EMPRESA' as debug_item,
  empresa_id,
  comissao_padrao,
  comissao_apenas_servico,
  comissao_retorno_ativo
FROM configuracoes_comissao;

-- 8. Teste manual do trigger
SELECT 
  'PROBLEMA PROVÁVEL' as debug_item,
  'Vamos ativar comissão do Pedro e forçar recalculo' as solucao;
