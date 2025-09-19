-- =====================================================
-- CORRIGIR FUNÇÃO DE COMISSÃO - VERSÃO FINAL
-- =====================================================

-- 1. Limpar logs anteriores para teste limpo
DELETE FROM teste_trigger_log WHERE mensagem LIKE '%COMISSAO%';

-- 2. Função de comissão simplificada baseada na que funcionou
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de entrada
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('COMISSAO: Iniciando - OS ' || NEW.numero_os || ' - Status: ' || OLD.status || ' -> ' || NEW.status);

    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('COMISSAO: Status mudou para ENTREGUE - processando...');
        
        -- Verificar se tem técnico
        IF NEW.tecnico_id IS NOT NULL THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('COMISSAO: Tecnico ID: ' || NEW.tecnico_id);
            
            -- Tentar inserir comissão
            BEGIN
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
                    10.00, -- Percentual fixo para teste
                    COALESCE(NEW.valor_servico, 0) * 0.10,
                    NOW(),
                    NEW.empresa_id,
                    NEW.cliente_id
                );
                
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('COMISSAO: Inserida com sucesso! Valor: ' || COALESCE(NEW.valor_servico, 0) * 0.10);
                
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('COMISSAO: ERRO ao inserir - ' || SQLERRM);
            END;
        ELSE
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('COMISSAO: Sem tecnico_id - ignorando');
        END IF;
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('COMISSAO: Status nao mudou para ENTREGUE - ignorando');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger de comissão
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 4. Verificar quantas comissões temos antes
SELECT 'ANTES DO TESTE' as momento, COUNT(*) as total FROM comissoes_historico;

-- 5. Teste: mudar status para algo diferente primeiro
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

-- 6. Depois mudar para ENTREGUE
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 7. Verificar logs da comissão
SELECT 'LOGS COMISSAO' as tipo, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%COMISSAO%'
ORDER BY timestamp;

-- 8. Verificar se comissão foi inserida
SELECT 'DEPOIS DO TESTE' as momento, COUNT(*) as total FROM comissoes_historico;

-- 9. Verificar dados da comissão se foi inserida
SELECT 
  'NOVA COMISSAO' as tipo,
  tecnico_id,
  valor_servico,
  valor_comissao,
  data_entrega
FROM comissoes_historico 
ORDER BY data_entrega DESC 
LIMIT 1;
