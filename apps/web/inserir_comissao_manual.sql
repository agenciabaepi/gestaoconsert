-- =====================================================
-- INSERIR COMISSÃO MANUALMENTE PARA TESTAR
-- =====================================================

-- Vamos tentar inserir uma comissão manualmente para ver se o problema é na função ou na tabela
DO $$
DECLARE
    test_os_id UUID;
    test_tecnico_id UUID;
    test_empresa_id UUID;
    test_valor_servico DECIMAL(10,2);
    comissao_calc DECIMAL(10,2);
BEGIN
    -- Pegar dados de uma OS do Pedro
    SELECT 
        os.id,
        os.tecnico_id,
        os.empresa_id,
        os.valor_servico
    INTO 
        test_os_id,
        test_tecnico_id,
        test_empresa_id,
        test_valor_servico
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE u.nome ILIKE '%Pedro%'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NULL THEN
        RAISE NOTICE 'Nenhuma OS encontrada!';
        RETURN;
    END IF;
    
    -- Calcular comissão (10% do valor do serviço)
    comissao_calc := test_valor_servico * 0.10;
    
    RAISE NOTICE 'OS: %, Técnico: %, Empresa: %, Valor Serviço: %, Comissão: %', 
                 test_os_id, test_tecnico_id, test_empresa_id, test_valor_servico, comissao_calc;
    
    -- Tentar inserir manualmente
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
        test_tecnico_id,
        test_os_id,
        test_empresa_id,
        test_valor_servico,
        0,
        test_valor_servico,
        10.00,
        comissao_calc,
        'NORMAL',
        'CALCULADA',
        NOW(),
        NOW(),
        'Teste manual de inserção',
        NOW()
    );
    
    RAISE NOTICE 'Comissão inserida manualmente com sucesso!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO ao inserir: % - %', SQLSTATE, SQLERRM;
END $$;

-- Verificar se foi inserida
SELECT 
  'RESULTADO INSERÇÃO MANUAL' as info,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as total_valor
FROM comissoes_historico;
