-- =====================================================
-- CONFIGURAR RLS PARA TABELA COMISSÕES
-- =====================================================

-- 1. Criar política para permitir inserções automáticas (trigger)
CREATE POLICY "Permitir inserção automática de comissões"
ON comissoes_historico
FOR INSERT
WITH CHECK (true);

-- 2. Criar política para leitura baseada na empresa
CREATE POLICY "Leitura de comissões por empresa"
ON comissoes_historico
FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE auth_user_id = auth.uid()
  )
);

-- 3. Verificar se as políticas foram criadas
SELECT 
  'POLÍTICAS CRIADAS' as info,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'comissoes_historico';

-- 4. Agora testar se conseguimos inserir COM RLS ativo
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
  150.00,
  0.00,
  150.00,
  10.00,
  15.00,
  'NORMAL',
  'CALCULADA',
  NOW(),
  NOW(),
  'Teste COM RLS e políticas',
  NOW()
);

-- 5. Verificar se funcionou
SELECT 
  'TESTE COM RLS' as resultado,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 6. Mostrar todas as comissões
SELECT 
  'TODAS AS COMISSÕES' as info,
  valor_comissao,
  observacoes,
  created_at
FROM comissoes_historico
ORDER BY created_at DESC;
