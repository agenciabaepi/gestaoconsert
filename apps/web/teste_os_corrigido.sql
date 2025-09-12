-- =====================================================
-- TESTE COM A OS ESPECÍFICA #910 - CORRIGIDO
-- =====================================================

-- Teste direto com a OS que sabemos que existe
DO $$
DECLARE
    test_os_id UUID := '5fb48a98-19e8-4603-a026-935312f27547';
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    os_status TEXT;
    os_tecnico UUID;
    os_valor DECIMAL(10,2);
    os_empresa UUID;
    tecnico_nome TEXT;
    tecnico_ativo BOOLEAN;
    tecnico_percentual DECIMAL(5,2);
BEGIN
    RAISE NOTICE 'Iniciando teste com OS específica: %', test_os_id;
    
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    RAISE NOTICE 'Comissões antes: %', comissoes_antes;
    
    -- Verificar dados da OS
    SELECT status, tecnico_id, valor_servico, empresa_id 
    INTO os_status, os_tecnico, os_valor, os_empresa
    FROM ordens_servico 
    WHERE id = test_os_id;
    
    RAISE NOTICE 'Dados da OS:';
    RAISE NOTICE '- Status: %, Técnico: %, Valor: %, Empresa: %', 
                 os_status, os_tecnico, os_valor, os_empresa;
    
    -- Verificar se o técnico tem comissão ativa
    SELECT u.nome, u.comissao_ativa, u.comissao_percentual
    INTO tecnico_nome, tecnico_ativo, tecnico_percentual
    FROM usuarios u
    WHERE u.id = os_tecnico;
    
    RAISE NOTICE '- Técnico: %, Ativo: %, Percentual: %', 
                 tecnico_nome, tecnico_ativo, tecnico_percentual;
    
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
        SELECT valor_comissao INTO os_valor
        FROM comissoes_historico 
        WHERE ordem_servico_id = test_os_id
        LIMIT 1;
        
        RAISE NOTICE 'Comissão criada: R$ %', os_valor;
    ELSE
        RAISE NOTICE 'PROBLEMA: Trigger não disparou ou não calculou comissão!';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no teste: % - %', SQLSTATE, SQLERRM;
END $$;
