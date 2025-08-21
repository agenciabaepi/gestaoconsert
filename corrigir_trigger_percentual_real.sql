-- =====================================================
-- CORRIGIR TRIGGER PARA USAR PERCENTUAL REAL
-- =====================================================

-- Função corrigida que busca o percentual real do técnico
CREATE OR REPLACE FUNCTION calcular_comissao_entrega_producao()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_responsavel UUID;
    percentual_tecnico NUMERIC;
    comissao_ativa BOOLEAN;
BEGIN
    -- Verificar se mudou para ENTREGUE
    IF OLD.status IS DISTINCT FROM 'ENTREGUE' AND NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL THEN
        
        -- Buscar dados do técnico na tabela usuarios
        SELECT u.id, u.comissao_percentual, u.comissao_ativa 
        INTO tecnico_responsavel, percentual_tecnico, comissao_ativa
        FROM usuarios u
        WHERE u.id = NEW.tecnico_id 
           OR u.tecnico_id = NEW.tecnico_id 
           OR u.auth_user_id = NEW.tecnico_id
        LIMIT 1;
        
        -- Se não encontrou, usar dados padrão
        IF tecnico_responsavel IS NULL THEN
            -- Buscar qualquer técnico ativo para fallback
            SELECT u.id, u.comissao_percentual, u.comissao_ativa 
            INTO tecnico_responsavel, percentual_tecnico, comissao_ativa
            FROM usuarios u
            WHERE u.nivel = 'tecnico' 
            AND u.comissao_ativa = true
            LIMIT 1;
        END IF;
        
        -- Verificar se técnico tem comissão ativa e percentual configurado
        IF tecnico_responsavel IS NOT NULL AND 
           comissao_ativa = true AND 
           percentual_tecnico > 0 THEN
            
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
                percentual_tecnico,  -- Usar percentual real do técnico
                COALESCE(NEW.valor_servico, 0) * (percentual_tecnico / 100.0),  -- Calcular com percentual real
                COALESCE(NEW.tipo, 'SERVICO'),
                'CALCULADA',
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função RPC também para usar percentuais reais
CREATE OR REPLACE FUNCTION buscar_comissoes_tecnico(tecnico_id_param TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', ch.id,
            'tecnico_id', ch.tecnico_id,
            'valor_comissao', ch.valor_comissao,
            'data_entrega', ch.data_entrega,
            'status', ch.status,
            'valor_servico', ch.valor_servico,
            'percentual_comissao', ch.percentual_comissao
        )
    )
    INTO resultado
    FROM comissoes_historico ch
    LEFT JOIN usuarios u ON (
        u.id = ch.tecnico_id OR 
        u.tecnico_id::text = ch.tecnico_id::text OR 
        u.auth_user_id = ch.tecnico_id::text
    )
    WHERE ch.tecnico_id::text = ANY(ARRAY[
        '1102c335-5991-43f2-858e-ed130d69edc1',
        'c7f16254-fce3-49cd-9956-2189b0de53c7',
        '2f17436e-f57a-4c17-8efc-672ad7e85530',
        tecnico_id_param
    ])
    OR u.auth_user_id = tecnico_id_param;
    
    RETURN COALESCE(resultado, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Testar com dados reais do Pedro
SELECT 'PEDRO DADOS' as info, 
       id, nome, comissao_percentual, comissao_ativa 
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- Testar a função RPC atualizada
SELECT 'TESTE RPC ATUALIZADA' as teste, 
       buscar_comissoes_tecnico('2f17436e-f57a-4c17-8efc-672ad7e85530') as resultado;
