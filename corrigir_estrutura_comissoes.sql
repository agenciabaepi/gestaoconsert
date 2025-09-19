-- =====================================================
-- CORRIGIR ESTRUTURA DA TABELA COMISSÕES
-- =====================================================

-- 1. Verificar estrutura atual da tabela
SELECT 
  'ESTRUTURA ATUAL' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 2. Adicionar coluna cliente_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comissoes_historico' 
        AND column_name = 'cliente_id'
    ) THEN
        ALTER TABLE comissoes_historico 
        ADD COLUMN cliente_id UUID REFERENCES clientes(id);
    END IF;
END $$;

-- 3. Tornar empresa_id opcional temporariamente ou buscar da OS
DO $$ 
BEGIN
    -- Se empresa_id for NOT NULL, tornar nullable temporariamente
    ALTER TABLE comissoes_historico 
    ALTER COLUMN empresa_id DROP NOT NULL;
END $$;

-- 4. Função corrigida com estrutura real da tabela
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('COMISSAO CORRIGIDA: Iniciando - OS ' || NEW.numero_os || ' - Status: ' || COALESCE(OLD.status, 'NULL') || ' -> ' || NEW.status);

    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('COMISSAO CORRIGIDA: Status mudou para ENTREGUE - processando...');
        
        -- Verificar se tem técnico
        IF NEW.tecnico_id IS NOT NULL THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('COMISSAO CORRIGIDA: Tecnico ID: ' || NEW.tecnico_id);
            
            -- Inserir comissão com campos que existem
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
                    10.00,
                    COALESCE(NEW.valor_servico, 0) * 0.10,
                    NOW(),
                    NEW.empresa_id, -- Buscar da OS
                    NEW.cliente_id  -- Buscar da OS
                );
                
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('COMISSAO CORRIGIDA: Inserida com sucesso! Valor: ' || COALESCE(NEW.valor_servico, 0) * 0.10);
                
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO teste_trigger_log (mensagem) 
                VALUES ('COMISSAO CORRIGIDA: ERRO - ' || SQLERRM);
            END;
        ELSE
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('COMISSAO CORRIGIDA: Sem tecnico_id - ignorando');
        END IF;
    ELSE
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('COMISSAO CORRIGIDA: Status nao mudou para ENTREGUE - ignorando');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Testar a função corrigida
UPDATE ordens_servico 
SET status = 'EM_ANALISE'
WHERE numero_os = '921';

UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 6. Verificar resultado
SELECT 'TESTE CORRIGIDO' as momento, COUNT(*) as total_comissoes FROM comissoes_historico;

-- 7. Ver logs da correção
SELECT 'LOGS CORRECAO' as tipo, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%COMISSAO CORRIGIDA%'
ORDER BY timestamp DESC
LIMIT 10;
