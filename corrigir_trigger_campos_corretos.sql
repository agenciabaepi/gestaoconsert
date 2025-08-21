-- =====================================================
-- CORRIGIR TRIGGER - USANDO CAMPOS CORRETOS
-- =====================================================

-- Função corrigida sem campo "observacoes" inexistente
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_producao()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_dados RECORD;
    config_empresa RECORD;
    valor_base NUMERIC := 0;
    valor_comissao NUMERIC := 0;
BEGIN
    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        
        -- Buscar dados do técnico
        SELECT u.id, u.nome, u.comissao_percentual, u.comissao_ativa, u.empresa_id
        INTO tecnico_dados
        FROM usuarios u
        WHERE u.id = NEW.tecnico_id 
           OR u.tecnico_id = NEW.tecnico_id 
           OR u.auth_user_id = NEW.tecnico_id
        LIMIT 1;
        
        -- Se não encontrou técnico, sair
        IF tecnico_dados.id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Verificar se técnico tem comissão ativa
        IF NOT tecnico_dados.comissao_ativa OR tecnico_dados.comissao_percentual <= 0 THEN
            RETURN NEW;
        END IF;
        
        -- Buscar configurações da empresa
        SELECT comissao_apenas_servico, comissao_retorno_ativo
        INTO config_empresa
        FROM configuracoes_comissao
        WHERE empresa_id = tecnico_dados.empresa_id;
        
        -- Se não tem configuração, usar padrão
        IF config_empresa IS NULL THEN
            config_empresa.comissao_apenas_servico := true;  -- Padrão: só serviços
            config_empresa.comissao_retorno_ativo := false;  -- Padrão: sem comissão em retorno
        END IF;
        
        -- Verificar se é retorno/garantia (usando campo "tipo")
        IF NOT config_empresa.comissao_retorno_ativo AND 
           (NEW.tipo ILIKE '%retorno%' OR NEW.tipo ILIKE '%garantia%') THEN
            -- Não calcular comissão para retornos se configurado para não ter
            RETURN NEW;
        END IF;
        
        -- Calcular valor base conforme configuração
        IF config_empresa.comissao_apenas_servico THEN
            -- Comissão apenas sobre serviços
            valor_base := COALESCE(NEW.valor_servico, 0);
        ELSE
            -- Comissão sobre serviços + peças
            valor_base := COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0);
        END IF;
        
        -- Calcular comissão usando percentual do técnico
        valor_comissao := valor_base * (tecnico_dados.comissao_percentual / 100.0);
        
        -- Inserir comissão apenas se valor > 0
        IF valor_comissao > 0 THEN
            INSERT INTO comissoes_historico (
                id,
                tecnico_id,
                ordem_servico_id,
                valor_servico,
                valor_peca,
                valor_total,
                percentual_comissao,
                valor_comissao,
                tipo_ordem,
                status,
                data_entrega
            ) VALUES (
                gen_random_uuid(),
                tecnico_dados.id,
                NEW.id,
                COALESCE(NEW.valor_servico, 0),
                COALESCE(NEW.valor_peca, 0),
                valor_base,
                tecnico_dados.comissao_percentual,  -- Usar percentual do técnico
                valor_comissao,
                COALESCE(NEW.tipo, 'SERVICO'),
                'CALCULADA',
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar percentual atual do Pedro
SELECT 
    'PEDRO CONFIGURACAO' as info,
    nome,
    comissao_percentual,
    comissao_ativa
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- Teste manual do cálculo
SELECT 
    'TESTE CALCULO' as info,
    100.00 as valor_servico,
    50.0 as percentual_pedro,
    (100.00 * 50.0 / 100.0) as comissao_esperada;
