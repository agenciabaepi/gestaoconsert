-- =====================================================
-- SOLUÇÃO FINAL PARA COMISSÕES
-- =====================================================

-- 1. Função corrigida com TODOS os campos obrigatórios
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_final()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('FINAL: OS ' || NEW.numero_os || ' - Status: ' || COALESCE(OLD.status, 'NULL') || ' -> ' || NEW.status);

    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('FINAL: Processando comissão para técnico ' || NEW.tecnico_id);
        
        BEGIN
            INSERT INTO comissoes_historico (
                id,                    -- UUID obrigatório
                tecnico_id,           -- UUID obrigatório
                ordem_servico_id,     -- UUID obrigatório  
                empresa_id,           -- UUID opcional
                valor_servico,        -- NUMERIC obrigatório
                valor_peca,           -- NUMERIC obrigatório
                valor_total,          -- NUMERIC obrigatório
                percentual_comissao,  -- NUMERIC obrigatório
                valor_comissao,       -- NUMERIC obrigatório
                tipo_ordem,           -- VARCHAR obrigatório
                status,               -- VARCHAR obrigatório
                data_entrega,         -- TIMESTAMP obrigatório
                cliente_id            -- UUID opcional
            ) VALUES (
                gen_random_uuid(),                           -- id
                NEW.tecnico_id,                              -- tecnico_id
                NEW.id,                                      -- ordem_servico_id
                NEW.empresa_id,                              -- empresa_id (pode ser NULL)
                COALESCE(NEW.valor_servico, 0),             -- valor_servico
                COALESCE(NEW.valor_peca, 0),                -- valor_peca
                COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0), -- valor_total
                10.00,                                       -- percentual_comissao
                COALESCE(NEW.valor_servico, 0) * 0.10,      -- valor_comissao (só da mão de obra)
                COALESCE(NEW.tipo, 'SERVICO'),              -- tipo_ordem
                'CALCULADA',                                 -- status
                NOW(),                                       -- data_entrega
                NEW.cliente_id                               -- cliente_id (pode ser NULL)
            );
            
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('FINAL: Comissão inserida! Valor: ' || COALESCE(NEW.valor_servico, 0) * 0.10);
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('FINAL: ERRO - ' || SQLSTATE || ' - ' || SQLERRM);
        END;
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('FINAL: Não processando - condições não atendidas');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega_final();

-- 3. Limpar logs anteriores
DELETE FROM teste_trigger_log WHERE mensagem LIKE '%FINAL%';

-- 4. Teste final
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 5. Verificar resultado
SELECT 'RESULTADO FINAL' as momento, COUNT(*) as total_comissoes FROM comissoes_historico;

-- 6. Ver logs do teste final
SELECT 'LOGS FINAL' as tipo, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%FINAL%'
ORDER BY timestamp DESC;

-- 7. Se funcionou, mostrar a comissão criada
SELECT 
  'COMISSAO CRIADA' as info,
  tecnico_id,
  valor_servico,
  valor_comissao,
  percentual_comissao,
  data_entrega
FROM comissoes_historico 
ORDER BY data_entrega DESC 
LIMIT 1;
