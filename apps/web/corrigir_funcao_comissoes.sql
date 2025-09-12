-- =====================================================
-- CORRIGIR A FUNÇÃO DE COMISSÕES
-- =====================================================

-- Primeiro, vamos dropar a função antiga
DROP FUNCTION IF EXISTS calcular_comissao_entrega();

-- Criar a função corrigida com todos os campos necessários
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    config_comissao DECIMAL(5,2);
    config_apenas_servico BOOLEAN;
    config_retorno BOOLEAN;
    valor_base DECIMAL(10,2);
    valor_comissao_calc DECIMAL(10,2);
    empresa_id_var UUID;
BEGIN
    -- Só calcular se mudou para ENTREGUE
    IF NEW.status != 'ENTREGUE' OR OLD.status = 'ENTREGUE' THEN
        RETURN NEW;
    END IF;
    
    -- Só calcular se tem técnico
    IF NEW.tecnico_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Buscar empresa_id da OS
    empresa_id_var := NEW.empresa_id;
    
    -- Buscar dados do técnico
    SELECT u.comissao_percentual, u.comissao_ativa
    INTO tecnico_comissao, tecnico_ativo
    FROM usuarios u
    WHERE u.id = NEW.tecnico_id;
    
    -- Verificar se técnico tem comissão ativa
    IF NOT COALESCE(tecnico_ativo, false) THEN
        RETURN NEW;
    END IF;
    
    -- Buscar configurações da empresa (com valores padrão)
    SELECT 
        COALESCE(comissao_padrao, 10.00),
        COALESCE(comissao_apenas_servico, true),
        COALESCE(comissao_retorno_ativo, false)
    INTO config_comissao, config_apenas_servico, config_retorno
    FROM configuracoes_comissao
    WHERE empresa_id = empresa_id_var;
    
    -- Se não encontrou config, usar padrões
    IF config_comissao IS NULL THEN
        config_comissao := 10.00;
        config_apenas_servico := true;
        config_retorno := false;
    END IF;
    
    -- Verificar se é retorno e se deve calcular comissão
    IF COALESCE(NEW.tipo, '') = 'RETORNO' AND NOT config_retorno THEN
        RETURN NEW;
    END IF;
    
    -- Calcular valor base
    IF config_apenas_servico THEN
        valor_base := COALESCE(NEW.valor_servico, 0);
    ELSE
        valor_base := COALESCE(NEW.valor_faturado, NEW.valor_servico + NEW.valor_peca, 0);
    END IF;
    
    -- Calcular comissão
    valor_comissao_calc := valor_base * (COALESCE(tecnico_comissao, config_comissao) / 100);
    
    -- Inserir na tabela de comissões com TODOS os campos necessários
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
        empresa_id_var,
        COALESCE(NEW.valor_servico, 0),
        COALESCE(NEW.valor_peca, 0),
        COALESCE(NEW.valor_faturado, NEW.valor_servico + NEW.valor_peca, 0),
        COALESCE(tecnico_comissao, config_comissao),
        valor_comissao_calc,
        COALESCE(NEW.tipo, 'NORMAL'),
        'CALCULADA',
        NOW(),
        NOW(),
        'Comissão calculada automaticamente',
        NOW()
    );
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, log e continue
    RAISE WARNING 'Erro ao calcular comissão: % - %', SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;

CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- Verificar se foi criado
SELECT 
  'FUNÇÃO RECRIADA' as status,
  routine_name
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

SELECT 
  'TRIGGER RECRIADO' as status,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';
