-- =====================================================
-- DEBUG TRIGGER ENTREGUE
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  'VERIFICAR TRIGGER' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar função do trigger
SELECT 
  'VERIFICAR FUNÇÃO' as info,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Verificar dados para teste
SELECT 
  'DADOS PARA TESTE' as info,
  u.nome,
  u.tecnico_id,
  u.comissao_ativa,
  u.comissao_percentual,
  COUNT(os.id) as total_os,
  COUNT(CASE WHEN os.status != 'ENTREGUE' THEN 1 END) as os_nao_entregues
FROM usuarios u
LEFT JOIN ordens_servico os ON os.tecnico_id = u.tecnico_id
WHERE u.nome ILIKE '%pedro%'
GROUP BY u.nome, u.tecnico_id, u.comissao_ativa, u.comissao_percentual;

-- 4. RECRIAR trigger com mais logs
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    empresa_os UUID;
    cliente_os UUID;
    usuario_nome TEXT;
BEGIN
    RAISE NOTICE '=== TRIGGER INICIADO ===';
    RAISE NOTICE 'OS ID: %, Status OLD: %, Status NEW: %', NEW.id, COALESCE(OLD.status, 'NULL'), NEW.status;
    RAISE NOTICE 'Tecnico_id: %', NEW.tecnico_id;
    
    -- Verificar se é mudança para ENTREGUE
    IF NEW.status = 'ENTREGUE' THEN
        RAISE NOTICE 'Status é ENTREGUE - verificando condições';
        
        -- Verificar se mudou para ENTREGUE
        IF OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'ENTREGUE' THEN
            RAISE NOTICE 'Mudança para ENTREGUE detectada';
            
            -- Verificar se tem técnico válido
            IF NEW.tecnico_id IS NULL THEN
                RAISE NOTICE 'ABORTAR: OS sem técnico atribuído';
                RETURN NEW;
            END IF;
            
            -- Buscar técnico por tecnico_id (UUID)
            SELECT u.nome, u.comissao_percentual, u.comissao_ativa
            INTO usuario_nome, tecnico_comissao, tecnico_ativo
            FROM usuarios u
            WHERE u.tecnico_id = NEW.tecnico_id;
            
            IF NOT FOUND THEN
                RAISE NOTICE 'ABORTAR: Técnico % não encontrado na tabela usuarios', NEW.tecnico_id;
                RETURN NEW;
            END IF;
            
            RAISE NOTICE 'Técnico encontrado: %, Comissão: %%, Ativa: %', usuario_nome, tecnico_comissao, tecnico_ativo;
            
            -- Verificar se técnico tem comissão ativa
            IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
                RAISE NOTICE 'ABORTAR: Técnico sem comissão ativa ou percentual zerado';
                RETURN NEW;
            END IF;
            
            -- Verificar se não é retorno (garantia)
            IF NEW.tipo = 'retorno' OR NEW.tipo = 'garantia' THEN
                RAISE NOTICE 'ABORTAR: OS é garantia/retorno - sem comissão';
                RETURN NEW;
            END IF;
            
            -- Verificar valor do serviço
            IF NEW.valor_servico IS NULL OR NEW.valor_servico = 0 THEN
                RAISE NOTICE 'ABORTAR: OS sem valor de serviço (valor: %)', NEW.valor_servico;
                RETURN NEW;
            END IF;
            
            -- Calcular comissão
            valor_comissao := (NEW.valor_servico * tecnico_comissao) / 100;
            RAISE NOTICE 'Valor serviço: %, Percentual: %%, Comissão calculada: %', NEW.valor_servico, tecnico_comissao, valor_comissao;
            
            -- Buscar empresa_id e cliente_id
            SELECT empresa_id, cliente_id INTO empresa_os, cliente_os
            FROM ordens_servico WHERE id = NEW.id;
            
            RAISE NOTICE 'Empresa: %, Cliente: %', empresa_os, cliente_os;
            
            -- Inserir na tabela de comissões
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
                    NEW.tecnico_id,
                    NEW.id,
                    NEW.valor_servico,
                    tecnico_comissao,
                    valor_comissao,
                    NOW(),
                    COALESCE(empresa_os, NEW.empresa_id),
                    COALESCE(cliente_os, NEW.cliente_id)
                );
                
                RAISE NOTICE '✅ SUCESSO: Comissão R$ % inserida para técnico %', valor_comissao, usuario_nome;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ ERRO ao inserir comissão: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Status já era ENTREGUE - não calculando novamente';
        END IF;
    ELSE
        RAISE NOTICE 'Status não é ENTREGUE (%) - trigger não executa', NEW.status;
    END IF;
    
    RAISE NOTICE '=== TRIGGER FINALIZADO ===';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 6. Teste manual do trigger
DO $$
DECLARE
    os_teste UUID;
    pedro_tecnico_id UUID;
BEGIN
    -- Buscar Pedro
    SELECT tecnico_id INTO pedro_tecnico_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Buscar uma OS do Pedro que não seja ENTREGUE
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_tecnico_id 
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        RAISE NOTICE '🔧 TESTE MANUAL: Atualizando OS % para ENTREGUE', os_teste;
        
        -- Garantir que tem valor de serviço e atualizar
        UPDATE ordens_servico 
        SET 
          valor_servico = 800.00,
          tipo = 'manutencao',
          status = 'ENTREGUE'
        WHERE id = os_teste;
        
        RAISE NOTICE '✅ Update executado - verificar logs acima';
    ELSE
        RAISE NOTICE '❌ Nenhuma OS encontrada para teste manual';
        RAISE NOTICE 'Pedro tecnico_id: %', pedro_tecnico_id;
    END IF;
END $$;
