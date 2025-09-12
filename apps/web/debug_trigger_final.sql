-- =====================================================
-- DEBUG FINAL DO TRIGGER
-- =====================================================

-- 1. Verificar se o trigger ainda existe
SELECT 
  'TRIGGER EXISTE?' as check_item,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar se a função ainda existe
SELECT 
  'FUNÇÃO EXISTE?' as check_item,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Verificar dados da OS específica que testamos
SELECT 
  'DADOS DA OS TESTADA' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id
FROM ordens_servico 
WHERE id = '5fb48a98-19e8-4603-a026-935312f27547';

-- 4. Verificar dados do técnico
SELECT 
  'DADOS DO TÉCNICO' as info,
  u.id,
  u.nome,
  u.nivel,
  u.comissao_ativa,
  u.comissao_percentual
FROM usuarios u
JOIN ordens_servico os ON os.tecnico_id = u.id
WHERE os.id = '5fb48a98-19e8-4603-a026-935312f27547';

-- 5. Testar inserção manual direta na tabela de comissões
INSERT INTO comissoes_historico (
  id,
  tecnico_id,
  ordem_servico_id,
  empresa_id,
  valor_servico,
  valor_peca,
  valor_total,
  percentual_comissao,
  valor_comissao,
  tipo_ordem,
  status,
  data_entrega,
  data_calculo,
  observacoes,
  created_at
) 
SELECT 
  gen_random_uuid(),
  os.tecnico_id,
  os.id,
  os.empresa_id,
  os.valor_servico,
  0,
  os.valor_servico,
  10.00,
  os.valor_servico * 0.10,
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Teste manual direto',
  NOW()
FROM ordens_servico os
WHERE os.id = '5fb48a98-19e8-4603-a026-935312f27547';

-- 6. Verificar se a inserção manual funcionou
SELECT 
  'INSERÇÃO MANUAL' as resultado,
  COUNT(*) as total_comissoes_agora
FROM comissoes_historico;
