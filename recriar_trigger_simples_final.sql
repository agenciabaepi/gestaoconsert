-- =====================================================
-- RECRIAR TRIGGER MAIS SIMPLES E FUNCIONAL
-- =====================================================

-- 1. Remover trigger e função existentes
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
DROP FUNCTION IF EXISTS calcular_comissao_entrega();

-- 2. Criar função mais simples
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao_calc DECIMAL(10,2);
BEGIN
    -- Log para debug
    RAISE NOTICE 'Trigger disparado para OS %, status OLD: %, NEW: %', NEW.id, OLD.status, NEW.status;
    
    -- Só processar se mudou PARA ENTREGUE
    IF NEW.status != 'ENTREGUE' THEN
        RETURN NEW;
    END IF;
    
    -- Só processar se não era ENTREGUE antes
    IF OLD.status = 'ENTREGUE' THEN
        RETURN NEW;
    END IF;
    
    -- Só processar se tem técnico
    IF NEW.tecnico_id IS NULL THEN
        RAISE NOTICE 'Sem técnico, ignorando';
        RETURN NEW;
    END IF;
    
    -- Só processar se tem valor
    IF COALESCE(NEW.valor_servico, 0) <= 0 THEN
        RAISE NOTICE 'Sem valor de serviço, ignorando';
        RETURN NEW;
    END IF;
    
    -- Buscar dados do técnico
    SELECT comissao_percentual, comissao_ativa
    INTO tecnico_comissao, tecnico_ativo
    FROM usuarios
    WHERE id = NEW.tecnico_id;
    
    -- Verificar se técnico tem comissão ativa
    IF NOT COALESCE(tecnico_ativo, false) THEN
        RAISE NOTICE 'Técnico sem comissão ativa, ignorando';
        RETURN NEW;
    END IF;
    
    -- Calcular comissão (10% padrão se não tiver configurado)
    valor_comissao_calc := NEW.valor_servico * (COALESCE(tecnico_comissao, 10.00) / 100);
    
    RAISE NOTICE 'Calculando comissão: valor_servico=%, percentual=%, comissao=%', 
                 NEW.valor_servico, COALESCE(tecnico_comissao, 10.00), valor_comissao_calc;
    
    -- Inserir comissão
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
        NEW.tecnico_id,
        NEW.id,
        NEW.empresa_id,
        NEW.valor_servico,
        COALESCE(NEW.valor_peca, 0),
        NEW.valor_servico + COALESCE(NEW.valor_peca, 0),
        COALESCE(tecnico_comissao, 10.00),
        valor_comissao_calc,
        COALESCE(NEW.tipo, 'NORMAL'),
        'CALCULADA',
        NOW(),
        NOW(),
        'Comissão automática via trigger',
        NOW()
    );
    
    RAISE NOTICE 'Comissão inserida com sucesso!';
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no trigger: % - %', SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 4. Verificar se foi criado
SELECT 'TRIGGER RECRIADO COM SUCESSO!' as resultado;
