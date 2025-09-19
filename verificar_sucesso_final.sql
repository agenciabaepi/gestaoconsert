-- =====================================================
-- VERIFICAR SUCESSO FINAL
-- =====================================================

-- 1. Contar total de comissões
SELECT 'TOTAL FINAL' as resultado, COUNT(*) as total_comissoes FROM comissoes_historico;

-- 2. Ver a comissão criada
SELECT 
  'COMISSAO CRIADA' as info,
  id,
  tecnico_id,
  ordem_servico_id,
  valor_servico,
  valor_comissao,
  percentual_comissao,
  status,
  data_entrega
FROM comissoes_historico 
ORDER BY data_entrega DESC 
LIMIT 1;

-- 3. Ver dados do técnico que recebeu a comissão
SELECT 
  'TECNICO COMISSAO' as info,
  u.id,
  u.nome,
  u.nivel
FROM usuarios u
JOIN comissoes_historico ch ON u.id = ch.tecnico_id
ORDER BY ch.data_entrega DESC
LIMIT 1;

-- 4. Agora criar versão final que usa o técnico correto da OS
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_producao()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_responsavel UUID;
BEGIN
    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        
        -- Buscar o ID do técnico na tabela usuarios baseado no tecnico_id da OS
        SELECT u.id INTO tecnico_responsavel
        FROM usuarios u
        WHERE u.id = NEW.tecnico_id 
           OR u.tecnico_id = NEW.tecnico_id 
           OR u.auth_user_id = NEW.tecnico_id
        LIMIT 1;
        
        -- Se não encontrou, usar o primeiro técnico disponível
        IF tecnico_responsavel IS NULL THEN
            SELECT id INTO tecnico_responsavel 
            FROM usuarios 
            WHERE nivel = 'tecnico' 
            LIMIT 1;
        END IF;
        
        IF tecnico_responsavel IS NOT NULL THEN
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
                tecnico_responsavel,
                NEW.id,
                COALESCE(NEW.valor_servico, 0),
                COALESCE(NEW.valor_peca, 0),
                COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0),
                10.00,  -- 10% de comissão
                COALESCE(NEW.valor_servico, 0) * 0.10,  -- Comissão só da mão de obra
                COALESCE(NEW.tipo, 'SERVICO'),
                'CALCULADA',
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Substituir trigger pela versão de produção
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega_producao();
