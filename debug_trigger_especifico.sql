-- =====================================================
-- DEBUG ESPECÍFICO DO TRIGGER
-- =====================================================

-- 1. Verificar se há OSs ENTREGUE com técnico
SELECT 
  'OSs ENTREGUE COM TÉCNICO' as info,
  COUNT(*) as total,
  string_agg(DISTINCT status, ', ') as status_existentes
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL;

-- 2. Ver detalhes das OSs do Pedro
SELECT 
  'DETALHES OSs PEDRO' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.valor_peca,
  os.valor_faturado,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa,
  u.comissao_percentual
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%'
ORDER BY os.created_at DESC;

-- 3. Verificar configurações da empresa
SELECT 
  'CONFIGURAÇÕES EMPRESA' as info,
  empresa_id,
  comissao_padrao,
  comissao_apenas_servico,
  comissao_retorno_ativo
FROM configuracoes_comissao;

-- 4. Teste manual simples - forçar uma única OS
SELECT 
  'TESTE: Vamos pegar uma OS específica' as info,
  id,
  numero_os,
  status,
  valor_servico
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND valor_servico > 0
LIMIT 1;
