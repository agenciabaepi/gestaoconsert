-- =====================================================
-- TESTAR A FUNÇÃO MANUALMENTE
-- =====================================================

-- Vamos executar a função diretamente para uma OS específica
DO $$
DECLARE
    test_os_id UUID;
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    config_comissao DECIMAL(5,2);
    config_apenas_servico BOOLEAN;
    config_retorno BOOLEAN;
    valor_base DECIMAL(10,2);
    valor_comissao_calc DECIMAL(10,2);
    empresa_id_var UUID;
BEGIN
    -- Pegar uma OS do Pedro
    SELECT id, empresa_id INTO test_os_id, empresa_id_var
    FROM ordens_servico 
    WHERE status = 'ENTREGUE' 
      AND tecnico_id IS NOT NULL 
    LIMIT 1;
    
    IF test_os_id IS NULL THEN
        RAISE NOTICE 'Nenhuma OS ENTREGUE encontrada!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando OS: %', test_os_id;
    
    -- Buscar dados do técnico
    SELECT u.comissao_percentual, u.comissao_ativa
    INTO tecnico_comissao, tecnico_ativo
    FROM usuarios u
    JOIN ordens_servico os ON os.tecnico_id = u.id
    WHERE os.id = test_os_id;
    
    RAISE NOTICE 'Técnico - Comissão: %, Ativo: %', tecnico_comissao, tecnico_ativo;
    
    -- Buscar configurações da empresa
    SELECT comissao_padrao, comissao_apenas_servico, comissao_retorno_ativo
    INTO config_comissao, config_apenas_servico, config_retorno
    FROM configuracoes_comissao
    WHERE empresa_id = empresa_id_var;
    
    RAISE NOTICE 'Config - Padrão: %, Apenas Serviço: %, Retorno: %', config_comissao, config_apenas_servico, config_retorno;
    
    -- Verificar se técnico tem comissão ativa
    IF NOT tecnico_ativo THEN
        RAISE NOTICE 'Técnico não tem comissão ativa!';
        RETURN;
    END IF;
    
    -- Calcular valor base
    SELECT 
        CASE 
            WHEN config_apenas_servico THEN COALESCE(valor_servico, 0)
            ELSE COALESCE(valor_faturado, valor_servico + valor_peca, 0)
        END
    INTO valor_base
    FROM ordens_servico
    WHERE id = test_os_id;
    
    RAISE NOTICE 'Valor base para comissão: %', valor_base;
    
    -- Calcular comissão
    valor_comissao_calc = valor_base * (COALESCE(tecnico_comissao, config_comissao) / 100);
    
    RAISE NOTICE 'Comissão calculada: %', valor_comissao_calc;
    
    -- Tentar inserir na tabela
    INSERT INTO comissoes_historico (
        tecnico_id,
        ordem_servico_id,
        valor_comissao,
        data_calculo,
        observacoes
    )
    SELECT 
        os.tecnico_id,
        os.id,
        valor_comissao_calc,
        NOW(),
        'Teste manual da função'
    FROM ordens_servico os
    WHERE os.id = test_os_id;
    
    RAISE NOTICE 'Comissão inserida com sucesso!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: % - %', SQLSTATE, SQLERRM;
END $$;
