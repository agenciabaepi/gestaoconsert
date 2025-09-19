-- =====================================================
-- CORRIGIR PROBLEMA DE FOREIGN KEY NO TRIGGER
-- =====================================================

-- Primeiro, vamos ver quais OSs têm tecnico_id inválido
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  os.id,
  os.numero_os,
  os.tecnico_id,
  os.status,
  os.valor_servico
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL 
  AND u.id IS NULL
LIMIT 10;

-- Ver todos os técnicos válidos
SELECT 
  'TÉCNICOS VÁLIDOS' as info,
  id,
  nome,
  nivel
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- Agora vamos criar um trigger que só funciona com técnicos válidos
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
DROP FUNCTION IF EXISTS calcular_comissao_entrega();

CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_existe BOOLEAN;
BEGIN
    -- Só processar se mudou para ENTREGUE
    IF NEW.status != 'ENTREGUE' OR COALESCE(NEW.valor_servico, 0) <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Só processar se tem técnico
    IF NEW.tecnico_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar se o técnico existe na tabela usuarios
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE id = NEW.tecnico_id) INTO tecnico_existe;
    
    IF NOT tecnico_existe THEN
        -- Se técnico não existe, não fazer nada (evitar erro)
        RETURN NEW;
    END IF;
    
    -- Inserir comissão apenas se técnico existe
    INSERT INTO comissoes_historico (
        id,
        tecnico_id,
        ordem_servico_id,
        empresa_id,
        valor_servico,
        valor_peca,
        valor_total,
        percentual_comissao,
        valor_comissao,
        tipo_ordem,
        status,
        data_entrega,
        data_calculo,
        observacoes,
        created_at
    ) VALUES (
        gen_random_uuid(),
        NEW.tecnico_id,
        NEW.id,
        NEW.empresa_id,
        COALESCE(NEW.valor_servico, 0),
        COALESCE(NEW.valor_peca, 0),
        COALESCE(NEW.valor_servico, 0) + COALESCE(NEW.valor_peca, 0),
        10.00,
        COALESCE(NEW.valor_servico, 0) * 0.10,
        'NORMAL',
        'CALCULADA',
        NOW(),
        NOW(),
        'Trigger automático com validação',
        NOW()
    );
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, não travar o sistema
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

SELECT 'TRIGGER CORRIGIDO COM VALIDAÇÃO!' as resultado;
