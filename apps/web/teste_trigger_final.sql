-- =====================================================
-- TESTE FINAL DO TRIGGER
-- =====================================================

-- 1. Ver quantas comissões temos ANTES do teste do trigger
SELECT 
  'ANTES DO TRIGGER' as momento,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 2. Forçar o trigger em uma OS real
UPDATE ordens_servico 
SET status = 'APROVADO' 
WHERE id = (
  SELECT os.id 
  FROM ordens_servico os
  JOIN usuarios u ON os.tecnico_id = u.id
  WHERE u.nome ILIKE '%Pedro%' 
    AND u.nivel = 'tecnico'
    AND os.valor_servico > 0
  LIMIT 1
);

UPDATE ordens_servico 
SET status = 'ENTREGUE' 
WHERE id = (
  SELECT os.id 
  FROM ordens_servico os
  JOIN usuarios u ON os.tecnico_id = u.id
  WHERE u.nome ILIKE '%Pedro%' 
    AND u.nivel = 'tecnico'
    AND os.valor_servico > 0
  LIMIT 1
);

-- 3. Ver quantas comissões temos DEPOIS do trigger
SELECT 
  'DEPOIS DO TRIGGER' as momento,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 4. Mostrar todas as comissões para ver se foi criada uma nova
SELECT 
  'TODAS AS COMISSÕES' as info,
  valor_comissao,
  observacoes,
  created_at
FROM comissoes_historico
ORDER BY created_at DESC;

-- 5. Se a nova comissão foi criada, mostrar detalhes
SELECT 
  'NOVA COMISSÃO (SE EXISTE)' as info,
  ch.valor_comissao,
  ch.percentual_comissao,
  os.numero_os,
  u.nome as tecnico_nome,
  ch.observacoes
FROM comissoes_historico ch
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
JOIN usuarios u ON ch.tecnico_id = u.id
WHERE ch.observacoes = 'Comissão automática via trigger'
ORDER BY ch.created_at DESC
LIMIT 1;
