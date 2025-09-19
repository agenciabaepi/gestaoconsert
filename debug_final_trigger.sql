-- =====================================================
-- DEBUG FINAL DO TRIGGER
-- =====================================================

-- 1. Verificar estrutura da tabela ordens_servico
SELECT 
  'ESTRUTURA ORDENS_SERVICO' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
  AND column_name IN ('empresa_id', 'tipo', 'valor_faturado')
ORDER BY ordinal_position;

-- 2. Verificar se o trigger está realmente ativo
SELECT 
  'TRIGGER DETAILS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 3. Testar se a função pode ser executada manualmente
SELECT 
  'TESTE MANUAL FUNÇÃO' as info,
  'Vamos tentar executar a função diretamente' as resultado;

-- 4. Ver uma OS específica em detalhes
SELECT 
  'OS DETALHES' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.valor_peca,
  os.valor_faturado,
  os.empresa_id,
  os.tipo,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa,
  u.comissao_percentual
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%'
  AND os.valor_servico > 0
LIMIT 1;
