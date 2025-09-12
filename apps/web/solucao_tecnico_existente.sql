-- =====================================================
-- SOLUÇÃO COM TÉCNICO EXISTENTE
-- =====================================================

-- 1. Primeiro vamos verificar quais técnicos existem realmente
SELECT 
  'TECNICOS EXISTENTES' as info,
  id,
  nome,
  nivel,
  tecnico_id,
  auth_user_id
FROM usuarios 
WHERE nivel = 'tecnico' 
   OR tecnico_id IS NOT NULL
LIMIT 5;

-- 2. Verificar qual tabela referencia o tecnico_id
SELECT 
  'FK CONSTRAINTS' as info,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'comissoes_historico' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'tecnico_id';

-- 3. Função que usa um ID válido da tabela usuarios
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_valida()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_valido UUID;
BEGIN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('VALIDA: OS ' || NEW.numero_os || ' - Status mudança detectada');

    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' THEN
        
        -- Buscar um técnico válido na tabela usuarios
        SELECT id INTO tecnico_valido 
        FROM usuarios 
        WHERE nivel = 'tecnico' 
        LIMIT 1;
        
        IF tecnico_valido IS NOT NULL THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('VALIDA: Usando técnico válido ' || tecnico_valido);
            
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
                ) VALUES (
                    gen_random_uuid(),
                    tecnico_valido,  -- Usar ID válido da tabela usuarios
                    NEW.id,
                    COALESCE(NEW.valor_servico, 100),  -- Valor padrão se NULL
                    0,  -- valor_peca zero
                    COALESCE(NEW.valor_servico, 100),  -- valor_total
                    10.00,
                    COALESCE(NEW.valor_servico, 100) * 0.10,
                    'SERVICO',
                    'CALCULADA',
                    NOW()
                );
                
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('VALIDA: Comissão inserida com sucesso!');
                
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('VALIDA: ERRO - ' || SQLSTATE || ' - ' || SQLERRM);
            END;
        ELSE
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('VALIDA: Nenhum técnico válido encontrado');
        END IF;
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('VALIDA: Status não mudou para ENTREGUE');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega_valida();

-- 5. Teste
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 6. Verificar resultado
SELECT 'RESULTADO VALIDO' as momento, COUNT(*) as total FROM comissoes_historico;

-- 7. Ver logs
SELECT 'LOGS VALIDO' as tipo, mensagem
FROM teste_trigger_log 
WHERE mensagem LIKE '%VALIDA%'
ORDER BY timestamp DESC
LIMIT 10;
