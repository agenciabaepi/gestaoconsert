-- =====================================================
-- TESTE SEM DEPENDÊNCIA DE LOGS
-- =====================================================

-- 1. Criar tabela temporária para testar triggers
CREATE TABLE IF NOT EXISTS teste_trigger_log (
    id SERIAL PRIMARY KEY,
    mensagem TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 2. Função de teste que grava na tabela
CREATE OR REPLACE FUNCTION teste_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir na tabela de log em vez de usar RAISE NOTICE
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('TRIGGER DISPAROU para OS: ' || NEW.id || ' - Status: ' || NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS teste_trigger_simples ON ordens_servico;
CREATE TRIGGER teste_trigger_simples
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION teste_trigger_func();

-- 4. Limpar log anterior
DELETE FROM teste_trigger_log;

-- 5. Verificar quantas comissões temos antes
SELECT 'ANTES' as momento, COUNT(*) as total FROM comissoes_historico;

-- 6. Fazer o teste
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 7. Verificar se o trigger disparou
SELECT 'TRIGGER LOG' as tipo, mensagem, timestamp 
FROM teste_trigger_log 
ORDER BY timestamp DESC;

-- 8. Verificar quantas comissões temos depois
SELECT 'DEPOIS' as momento, COUNT(*) as total FROM comissoes_historico;

-- 9. Agora testar o trigger de comissão especificamente
-- Recriar a função de comissão com log na tabela
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL;
    tecnico_ativo BOOLEAN;
    valor_comissao_calc DECIMAL;
    empresa_do_tecnico UUID;
BEGIN
    -- Log de entrada
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('FUNCAO COMISSAO INICIADA - OS: ' || NEW.id || ' - Status: ' || NEW.status);

    -- Verificar se é mudança para ENTREGUE
    IF OLD.status != 'ENTREGUE' AND NEW.status = 'ENTREGUE' THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('STATUS MUDOU PARA ENTREGUE - processando...');
        
        -- Inserir comissão fixa para teste
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega,
            empresa_id,
            cliente_id
        ) VALUES (
            NEW.tecnico_id,
            NEW.id,
            COALESCE(NEW.valor_servico, 0),
            10.00,
            COALESCE(NEW.valor_servico, 0) * 0.10,
            NOW(),
            NEW.empresa_id,
            NEW.cliente_id
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('COMISSAO INSERIDA COM SUCESSO!');
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('STATUS NAO MUDOU PARA ENTREGUE - ignorando');
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('ERRO NA FUNCAO: ' || SQLERRM);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Testar mudança de status para disparar comissão
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

-- Depois mudar para ENTREGUE
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 11. Verificar todos os logs
SELECT 'TODOS OS LOGS' as tipo, mensagem, timestamp 
FROM teste_trigger_log 
ORDER BY timestamp;

-- 12. Verificar resultado final
SELECT 'FINAL' as momento, COUNT(*) as total_comissoes FROM comissoes_historico;
