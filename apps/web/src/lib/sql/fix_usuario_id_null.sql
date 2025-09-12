-- =====================================================
-- CORRIGIR CONSTRAINT NOT NULL DO usuario_id
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- Remover constraint NOT NULL da coluna usuario_id
ALTER TABLE status_historico ALTER COLUMN usuario_id DROP NOT NULL;

-- Verificar a estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'status_historico'
  AND column_name = 'usuario_id';

-- Testar inserção com usuario_id NULL
INSERT INTO status_historico (
  os_id,
  status_anterior,
  status_novo,
  usuario_id,
  usuario_nome,
  motivo
) VALUES (
  (SELECT id FROM ordens_servico LIMIT 1),
  'TESTE_NULL',
  'TESTE_USUARIO_NULL',
  NULL, -- Agora deve funcionar
  'Sistema',
  'Teste com usuario_id NULL'
);

-- Verificar se foi inserido
SELECT 
  id,
  usuario_id,
  usuario_nome,
  status_anterior,
  status_novo,
  created_at
FROM status_historico 
WHERE status_anterior = 'TESTE_NULL'
ORDER BY created_at DESC;

SELECT 'Constraint NOT NULL removida com sucesso!' as resultado;
