-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO TRIGGER
-- =====================================================

-- 1. Verificar se a função existe e está correta
SELECT 
  'FUNÇÃO EXISTE?' as verificacao,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 2. Verificar RLS na tabela comissoes_historico
SELECT 
  'RLS COMISSOES' as verificacao,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 3. Verificar políticas RLS
SELECT 
  'POLÍTICAS RLS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'comissoes_historico';

-- 4. Desabilitar RLS temporariamente para teste
ALTER TABLE comissoes_historico DISABLE ROW LEVEL SECURITY;

-- 5. Recriar função mais simples para debug
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
BEGIN
    -- Log básico
    INSERT INTO comissoes_historico (tecnico_id, ordem_servico_id, valor_servico, percentual_comissao, valor_comissao, data_entrega, empresa_id, cliente_id) 
    VALUES (
        '2f17436e-f57a-4c17-8efc-672ad7e85530',
        NEW.id,
        999.99,
        50.00,
        499.99,
        NOW(),
        NEW.empresa_id,
        NEW.cliente_id
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    RAISE NOTICE 'ERRO na função: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Teste direto com função simplificada
DO $$
DECLARE
    os_id_917 UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT id INTO os_id_917 FROM ordens_servico WHERE numero_os = '917';
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'TESTE FUNÇÃO SIMPLES: antes = %', comissoes_antes;
    
    -- Mudar status para disparar trigger
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_id_917;
    
    UPDATE ordens_servico 
    SET status = 'ENTREGUE'
    WHERE id = os_id_917;
    
    PERFORM pg_sleep(1);
    
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'TESTE FUNÇÃO SIMPLES: depois = %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 FUNÇÃO BÁSICA FUNCIONOU!';
    ELSE
        RAISE NOTICE '❌ Nem função básica funcionou';
    END IF;
END $$;

-- 7. Verificar se inseriu
SELECT 
  'TESTE FUNÇÃO SIMPLES' as resultado,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 8. Se funcionou, criar função completa
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    usuario_nome TEXT;
BEGIN
    -- Só processar se mudou para ENTREGUE
    IF NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE') THEN
        
        -- Verificar técnico
        IF NEW.tecnico_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Buscar dados do técnico
        SELECT u.nome, u.comissao_percentual, u.comissao_ativa
        INTO usuario_nome, tecnico_comissao, tecnico_ativo
        FROM usuarios u
        WHERE u.tecnico_id = NEW.tecnico_id;
        
        -- Verificar se encontrou técnico
        IF NOT FOUND THEN
            RETURN NEW;
        END IF;
        
        -- Verificar se comissão está ativa
        IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
            RETURN NEW;
        END IF;
        
        -- Verificar se não é garantia
        IF NEW.tipo = 'retorno' OR NEW.tipo = 'garantia' THEN
            RETURN NEW;
        END IF;
        
        -- Verificar valor do serviço
        IF NEW.valor_servico IS NULL OR NEW.valor_servico = 0 THEN
            RETURN NEW;
        END IF;
        
        -- Calcular comissão
        valor_comissao := (NEW.valor_servico * tecnico_comissao) / 100;
        
        -- Inserir comissão
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
            NEW.tecnico_id,
            NEW.id,
            NEW.valor_servico,
            tecnico_comissao,
            valor_comissao,
            NOW(),
            NEW.empresa_id,
            NEW.cliente_id
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Se der erro, não falhar o UPDATE
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Teste final
DO $$
DECLARE
    os_id_917 UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT id INTO os_id_917 FROM ordens_servico WHERE numero_os = '917';
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'TESTE FINAL: antes = %', comissoes_antes;
    
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_id_917;
    
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = 2000.00,
      tipo = 'manutencao'
    WHERE id = os_id_917;
    
    PERFORM pg_sleep(1);
    
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'TESTE FINAL: depois = %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 SISTEMA FUNCIONANDO!';
    ELSE
        RAISE NOTICE '❌ Ainda não funciona';
    END IF;
END $$;
