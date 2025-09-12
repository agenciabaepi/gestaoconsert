-- =====================================================
-- DIAGNÓSTICO CORRIGIDO
-- =====================================================

-- 1. Primeiro verificar estrutura da tabela ordens_servico
SELECT 
  'COLUNAS OS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ordens_servico'
ORDER BY ordinal_position;

-- 2. Verificar se o trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 3. Criar trigger de teste simples
DROP TRIGGER IF EXISTS teste_trigger_simples ON ordens_servico;

CREATE OR REPLACE FUNCTION teste_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'TRIGGER DISPAROU! Status: %', NEW.status;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teste_trigger_simples
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION teste_trigger_func();

-- 4. Teste com coluna que existe (status)
DO $$
DECLARE
    os_id UUID;
    status_atual TEXT;
BEGIN
    SELECT id, status INTO os_id, status_atual 
    FROM ordens_servico 
    WHERE numero_os = '921' 
    LIMIT 1;
    
    RAISE NOTICE 'Testando trigger com OS: %, Status atual: %', os_id, status_atual;
    
    -- Update no status para disparar trigger
    UPDATE ordens_servico 
    SET status = COALESCE(status, 'EM_ANALISE')
    WHERE id = os_id;
    
    RAISE NOTICE 'Update executado no status';
END $$;

-- 5. Verificar RLS nas tabelas críticas
SELECT 
  'RLS COMISSOES' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 6. Verificar políticas RLS
SELECT 
  'POLICIES COMISSOES' as info,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'comissoes_historico';

-- 7. Verificar se conseguimos inserir diretamente na tabela
DO $$
DECLARE
    antes INTEGER;
    depois INTEGER;
BEGIN
    SELECT COUNT(*) INTO antes FROM comissoes_historico;
    
    BEGIN
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega,
            empresa_id,
            cliente_id
        ) VALUES (
            '2f17436e-f57a-4c17-8efc-672ad7e85530',
            (SELECT id FROM ordens_servico WHERE numero_os = '921' LIMIT 1),
            100.00,
            10.00,
            10.00,
            NOW(),
            (SELECT empresa_id FROM ordens_servico WHERE numero_os = '921' LIMIT 1),
            (SELECT cliente_id FROM ordens_servico WHERE numero_os = '921' LIMIT 1)
        );
        
        SELECT COUNT(*) INTO depois FROM comissoes_historico;
        RAISE NOTICE 'INSERT DIRETO: Antes %, Depois %', antes, depois;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO INSERT DIRETO: %', SQLERRM;
    END;
END $$;
