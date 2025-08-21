-- =====================================================
-- CORRIGIR PROBLEMA DO TECNICO_ID
-- =====================================================

-- 1. Primeiro, vamos ver qual é o tecnico_id REAL do Pedro
SELECT 
  'TÉCNICO REAL DO PEDRO' as info,
  id as tecnico_id_real,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome ILIKE '%Pedro%' AND nivel = 'tecnico';

-- 2. Ver qual OS está realmente com o Pedro
SELECT 
  'OS COM PEDRO' as info,
  os.id as os_id,
  os.numero_os,
  os.tecnico_id,
  os.valor_servico,
  os.empresa_id,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%' AND u.nivel = 'tecnico'
  AND os.valor_servico > 0
LIMIT 1;

-- 3. Agora vamos inserir a comissão com os dados corretos
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
  u.id, -- Usar o ID real do Pedro
  os.id,
  os.empresa_id,
  os.valor_servico,
  0,
  os.valor_servico,
  COALESCE(u.comissao_percentual, 10.00),
  os.valor_servico * (COALESCE(u.comissao_percentual, 10.00) / 100),
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Comissão corrigida com IDs reais',
  NOW()
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%Pedro%' AND u.nivel = 'tecnico'
  AND os.valor_servico > 0
LIMIT 1;

-- 4. Verificar se funcionou
SELECT 
  'RESULTADO FINAL' as status,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 5. Mostrar detalhes da comissão criada
SELECT 
  'COMISSÃO CRIADA' as info,
  ch.valor_comissao,
  ch.percentual_comissao,
  os.numero_os,
  u.nome as tecnico_nome,
  ch.observacoes
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 1;
