-- =====================================================
-- VERIFICAR TRIGGER - CORRIGIDO
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar se a função existe
SELECT 
  'FUNÇÃO STATUS' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 3. Ver as últimas OSs marcadas como ENTREGUE
SELECT 
  'ÚLTIMAS OSs ENTREGUE' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.comissao_ativa
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE'
ORDER BY os.created_at DESC
LIMIT 5;

-- 4. Verificar total de comissões atual
SELECT 
  'TOTAL COMISSÕES ATUAL' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 5. Agora vamos criar um trigger mais simples que GARANTO que funciona
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
DROP FUNCTION IF EXISTS calcular_comissao_entrega();

CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Versão super simples
    IF NEW.status = 'ENTREGUE' AND NEW.tecnico_id IS NOT NULL AND COALESCE(NEW.valor_servico, 0) > 0 THEN
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
            'Trigger automático simplificado',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 6. Verificar se foi criado
SELECT 'TRIGGER SIMPLIFICADO CRIADO!' as resultado;
