-- =====================================================
-- TESTE COM A OS ESPECÍFICA #910
-- =====================================================

-- Teste direto com a OS que sabemos que existe
DO $$
DECLARE
    test_os_id UUID := '5fb48a98-19e8-4603-a026-935312f27547';
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando teste com OS específica: %', test_os_id;
    
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    RAISE NOTICE 'Comissões antes: %', comissoes_antes;
    
    -- Verificar dados da OS
    RAISE NOTICE 'Dados da OS:';
    FOR r IN 
        SELECT status, tecnico_id, valor_servico, empresa_id 
        FROM ordens_servico 
        WHERE id = test_os_id
    LOOP
        RAISE NOTICE '- Status: %, Técnico: %, Valor: %, Empresa: %', 
                     r.status, r.tecnico_id, r.valor_servico, r.empresa_id;
    END LOOP;
    
    -- Verificar se o técnico tem comissão ativa
    FOR r IN 
        SELECT u.nome, u.comissao_ativa, u.comissao_percentual
        FROM usuarios u
        JOIN ordens_servico os ON os.tecnico_id = u.id
        WHERE os.id = test_os_id
    LOOP
        RAISE NOTICE '- Técnico: %, Ativo: %, Percentual: %', 
                     r.nome, r.comissao_ativa, r.comissao_percentual;
    END LOOP;
    
    -- Forçar mudança de status para disparar o trigger
    RAISE NOTICE 'Mudando status para APROVADO...';
    UPDATE ordens_servico 
    SET status = 'APROVADO' 
    WHERE id = test_os_id;
    
    RAISE NOTICE 'Mudando status para ENTREGUE...';
    UPDATE ordens_servico 
    SET status = 'ENTREGUE' 
    WHERE id = test_os_id;
    
    -- Contar comissões depois
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'Comissões depois: %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE 'SUCESSO! Comissão foi calculada!';
        
        -- Mostrar detalhes da comissão criada
        FOR r IN 
            SELECT valor_comissao, percentual_comissao, observacoes
            FROM comissoes_historico 
            WHERE ordem_servico_id = test_os_id
        LOOP
            RAISE NOTICE 'Comissão criada: R$ %, Percentual: %, Obs: %', 
                         r.valor_comissao, r.percentual_comissao, r.observacoes;
        END LOOP;
    ELSE
        RAISE NOTICE 'PROBLEMA: Trigger não disparou ou não calculou comissão!';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no teste: % - %', SQLSTATE, SQLERRM;
END $$;
