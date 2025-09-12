-- =====================================================
-- DESABILITAR RLS PARA TESTE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- Desabilitar RLS completamente na tabela status_historico
ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON status_historico;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON status_historico;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON status_historico;

-- Verificar se a tabela tem RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'status_historico';

-- Testar inserção manual direta
INSERT INTO status_historico (
  os_id,
  status_anterior,
  status_novo,
  usuario_nome,
  motivo
) VALUES (
  (SELECT id FROM ordens_servico LIMIT 1),
  'TESTE_MANUAL',
  'TESTE_INSERÇÃO',
  'Teste Direto',
  'Teste de inserção manual'
);

-- Verificar se foi inserido
SELECT 
  id,
  status_anterior,
  status_novo,
  usuario_nome,
  motivo,
  created_at
FROM status_historico 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'RLS desabilitado e teste manual realizado!' as resultado;
