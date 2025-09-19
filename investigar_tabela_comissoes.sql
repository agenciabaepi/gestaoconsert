-- =====================================================
-- INVESTIGAR PROBLEMA NA TABELA COMISSÕES
-- =====================================================

-- 1. Verificar se a tabela existe
SELECT 
  'TABELA EXISTE?' as check_item,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'comissoes_historico';

-- 2. Verificar Row Level Security (RLS)
SELECT 
  'RLS STATUS' as check_item,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 3. Verificar políticas de RLS
SELECT 
  'POLÍTICAS RLS' as check_item,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'comissoes_historico';

-- 4. Tentar inserir um registro simples para teste
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
  '5671d662-42e6-4193-953a-a2fffac04585'::uuid,
  '5fb48a98-19e8-4603-a026-935312f27547'::uuid,
  '22a804a8-b16e-4c70-a6ca-123456789abc'::uuid,
  160.00,
  0.00,
  160.00,
  10.00,
  16.00,
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Teste direto de inserção',
  NOW()
);

-- 5. Verificar se o registro foi inserido
SELECT 
  'VERIFICAÇÃO PÓS-INSERÇÃO' as resultado,
  COUNT(*) as total_registros
FROM comissoes_historico;

-- 6. Se não conseguir inserir, tentar sem RLS
SET row_security = off;

-- 7. Tentar inserir novamente sem RLS
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
  '5671d662-42e6-4193-953a-a2fffac04585'::uuid,
  '5fb48a98-19e8-4603-a026-935312f27547'::uuid,
  '22a804a8-b16e-4c70-a6ca-123456789abc'::uuid,
  160.00,
  0.00,
  160.00,
  10.00,
  16.00,
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Teste sem RLS',
  NOW()
);

-- 8. Verificar novamente
SELECT 
  'VERIFICAÇÃO FINAL' as resultado,
  COUNT(*) as total_registros
FROM comissoes_historico;
