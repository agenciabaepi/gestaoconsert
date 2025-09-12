-- =====================================================
-- DEBUG FINAL COMPLETO
-- =====================================================

-- 1. Contar comissões
SELECT 'TOTAL COMISSOES' as info, COUNT(*) as total FROM comissoes_historico;

-- 2. Estrutura da tabela comissoes_historico
SELECT 
  'ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 3. Ver erros nos logs
SELECT 
  'ERROS' as tipo,
  mensagem
FROM teste_trigger_log 
WHERE mensagem LIKE '%ERRO%' 
   OR mensagem LIKE '%MANUAL%'
ORDER BY timestamp DESC 
LIMIT 5;

-- 4. Dados completos da OS 921
SELECT 
  'OS 921 COMPLETA' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id,
  cliente_id,
  created_at
FROM ordens_servico 
WHERE numero_os = '921';

-- 5. Teste de inserção super básico com dados conhecidos
DO $$
BEGIN
    BEGIN
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega
        ) VALUES (
            '2f17436e-f57a-4c17-8efc-672ad7e85530',
            'eb0ba440-de2c-4a3f-a35a-074b75057d6d',
            123.45,
            10.00,
            12.35,
            NOW()
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('TESTE BASICO: Inserção funcionou!');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('TESTE BASICO: ERRO - ' || SQLSTATE || ' - ' || SQLERRM);
    END;
END $$;

-- 6. Verificar se teste básico funcionou
SELECT 'APOS TESTE BASICO' as momento, COUNT(*) as total FROM comissoes_historico;

-- 7. Se funcionou, criar trigger final simplificado
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_final()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de entrada
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('TRIGGER FINAL: OS ' || NEW.numero_os || ' - Status: ' || COALESCE(OLD.status, 'NULL') || ' -> ' || NEW.status);

    -- Só processar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        BEGIN
            INSERT INTO comissoes_historico (
                tecnico_id,
                ordem_servico_id,
                valor_servico,
                percentual_comissao,
                valor_comissao,
                data_entrega
            ) VALUES (
                NEW.tecnico_id,
                NEW.id,
                COALESCE(NEW.valor_servico, 0),
                10.00,
                COALESCE(NEW.valor_servico, 0) * 0.10,
                NOW()
            );
            
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('TRIGGER FINAL: Comissão inserida! Valor: ' || COALESCE(NEW.valor_servico, 0) * 0.10);
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO teste_trigger_log (mensagem) 
            VALUES ('TRIGGER FINAL: ERRO - ' || SQLSTATE || ' - ' || SQLERRM);
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recriar trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega_final();
