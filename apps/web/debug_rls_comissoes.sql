-- =====================================================
-- DEBUG RLS E PERMISSÕES
-- =====================================================

-- 1. Verificar se RLS está ativo na tabela
SELECT 
  'RLS STATUS' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 2. Ver políticas de RLS
SELECT 
  'POLÍTICAS RLS' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'comissoes_historico';

-- 3. Desabilitar RLS temporariamente para testar
ALTER TABLE comissoes_historico DISABLE ROW LEVEL SECURITY;

-- 4. Tentar inserir sem RLS
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
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM usuarios WHERE nome ILIKE '%Pedro%' AND nivel = 'tecnico' LIMIT 1),
  (SELECT id FROM ordens_servico WHERE valor_servico > 0 LIMIT 1),
  (SELECT empresa_id FROM usuarios WHERE nome ILIKE '%Pedro%' AND nivel = 'tecnico' LIMIT 1),
  100.00,
  0.00,
  100.00,
  10.00,
  10.00,
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Teste sem RLS',
  NOW()
);

-- 5. Verificar se foi inserido
SELECT 
  'TESTE SEM RLS' as resultado,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 6. Se funcionou, mostrar o registro
SELECT 
  'REGISTRO INSERIDO' as info,
  id,
  valor_comissao,
  observacoes
FROM comissoes_historico
ORDER BY created_at DESC
LIMIT 1;

-- 7. Reabilitar RLS
ALTER TABLE comissoes_historico ENABLE ROW LEVEL SECURITY;
