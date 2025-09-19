-- =====================================================
-- DIAGNÓSTICO COMPLETO DO TRIGGER
-- =====================================================

-- 1. Verificar se o trigger realmente existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar se a função existe
SELECT 
  'FUNCTION STATUS' as info,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Verificar usuário atual e permissões
SELECT 
  'USER INFO' as info,
  current_user as usuario_atual,
  session_user as usuario_sessao;

-- 4. Verificar se RLS está ativo na tabela comissoes_historico
SELECT 
  'RLS STATUS' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 5. Verificar se RLS está ativo na tabela ordens_servico
SELECT 
  'RLS STATUS OS' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'ordens_servico';

-- 6. Tentar criar trigger com nome diferente
DROP TRIGGER IF EXISTS teste_trigger_simples ON ordens_servico;

CREATE OR REPLACE FUNCTION teste_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Log simples no PostgreSQL
    RAISE NOTICE 'TRIGGER DISPAROU! OLD status: %, NEW status: %', OLD.status, NEW.status;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teste_trigger_simples
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION teste_trigger_func();

-- 7. Teste direto com log
DO $$
DECLARE
    os_id UUID;
BEGIN
    SELECT id INTO os_id FROM ordens_servico WHERE numero_os = '921' LIMIT 1;
    
    RAISE NOTICE 'Testando trigger com OS: %', os_id;
    
    -- Update simples que deve disparar o trigger
    UPDATE ordens_servico 
    SET observacoes = 'TESTE TRIGGER ' || NOW()
    WHERE id = os_id;
    
    RAISE NOTICE 'Update executado';
END $$;

-- 8. Verificar se existem políticas RLS que podem estar bloqueando
SELECT 
  'POLICIES' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('comissoes_historico', 'ordens_servico');

-- 9. Verificar configurações do PostgreSQL
SELECT name, setting 
FROM pg_settings 
WHERE name IN ('log_statement', 'log_min_messages', 'shared_preload_libraries');
