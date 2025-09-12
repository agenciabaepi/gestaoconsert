-- =====================================================
-- RECRIAR TRIGGER MAIS SIMPLES
-- =====================================================

-- Vamos criar uma versão mais simples da função para debugar
DROP FUNCTION IF EXISTS calcular_comissao_entrega() CASCADE;

CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de debug
    RAISE NOTICE 'TRIGGER DISPARADO! Status OLD: %, Status NEW: %, OS: %', 
                 COALESCE(OLD.status, 'NULL'), NEW.status, NEW.id;
    
    -- Condições básicas
    IF NEW.status != 'ENTREGUE' THEN
        RAISE NOTICE 'Status não é ENTREGUE, ignorando...';
        RETURN NEW;
    END IF;
    
    IF OLD.status = 'ENTREGUE' THEN
        RAISE NOTICE 'Status já era ENTREGUE, ignorando...';
        RETURN NEW;
    END IF;
    
    IF NEW.tecnico_id IS NULL THEN
        RAISE NOTICE 'Técnico é NULL, ignorando...';
        RETURN NEW;
    END IF;
    
    -- Se chegou até aqui, vamos tentar inserir
    RAISE NOTICE 'Todas as condições OK, inserindo comissão...';
    
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
        COALESCE(NEW.valor_servico, 0),
        COALESCE(NEW.valor_peca, 0),
        COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0),
        10.00, -- Percentual fixo para teste
        COALESCE(NEW.valor_servico, 0) * 0.10, -- 10% do valor do serviço
        'NORMAL',
        'CALCULADA',
        NOW(),
        NOW(),
        'Comissão automática via trigger',
        NOW()
    );
    
    RAISE NOTICE 'Comissão inserida com sucesso!';
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO na função: % - %', SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;

CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

RAISE NOTICE 'Trigger recriado com logs de debug!';
