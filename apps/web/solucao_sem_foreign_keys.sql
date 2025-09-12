-- =====================================================
-- SOLUÇÃO SEM FOREIGN KEYS PROBLEMÁTICAS
-- =====================================================

-- 1. Função que só usa campos seguros (sem FKs problemáticas)
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_segura()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('SEGURA: OS ' || NEW.numero_os || ' - Status: ' || COALESCE(OLD.status, 'NULL') || ' -> ' || NEW.status);

    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('SEGURA: Processando comissão para técnico ' || NEW.tecnico_id);
        
        BEGIN
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
                -- Removendo empresa_id e cliente_id que podem ter FK problemática
            ) VALUES (
                gen_random_uuid(),
                NEW.tecnico_id,
                NEW.id,
                COALESCE(NEW.valor_servico, 0),
                COALESCE(NEW.valor_peca, 0),
                COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0),
                10.00,
                COALESCE(NEW.valor_servico, 0) * 0.10,
                'SERVICO',
                'CALCULADA',
                NOW()
            );
            
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('SEGURA: Comissão inserida com sucesso! Valor: ' || COALESCE(NEW.valor_servico, 0) * 0.10);
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('SEGURA: ERRO - ' || SQLSTATE || ' - ' || SQLERRM);
        END;
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('SEGURA: Condições não atendidas');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar trigger com função segura
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega_segura();

-- 3. Limpar logs
DELETE FROM teste_trigger_log WHERE mensagem LIKE '%SEGURA%';

-- 4. Teste
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 5. Verificar resultado
SELECT 'TESTE SEGURO' as momento, COUNT(*) as total_comissoes FROM comissoes_historico;

-- 6. Ver logs
SELECT 'LOGS SEGURO' as tipo, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%SEGURA%'
ORDER BY timestamp DESC;

-- 7. Ver comissão criada se funcionou
SELECT 
  'COMISSAO SEGURA' as info,
  id,
  tecnico_id,
  ordem_servico_id,
  valor_servico,
  valor_comissao,
  status,
  data_entrega
FROM comissoes_historico 
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
ORDER BY data_entrega DESC 
LIMIT 1;
