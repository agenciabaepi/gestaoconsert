-- =====================================================
-- OPÇÕES PARA RECALCULAR COMISSÕES
-- =====================================================

-- OPÇÃO 1: Ver diferença entre comissões antigas e novas
SELECT 
    ch.id,
    ch.valor_servico,
    ch.percentual_comissao as percentual_antigo,
    u.comissao_percentual as percentual_atual,
    ch.valor_comissao as comissao_antiga,
    (ch.valor_servico * u.comissao_percentual / 100.0) as comissao_nova,
    ((ch.valor_servico * u.comissao_percentual / 100.0) - ch.valor_comissao) as diferenca
FROM comissoes_historico ch
JOIN usuarios u ON u.id = ch.tecnico_id
WHERE ch.percentual_comissao != u.comissao_percentual;

-- OPÇÃO 2: Recalcular apenas comissões do mês atual (CUIDADO!)
-- UPDATE comissoes_historico 
-- SET 
--     percentual_comissao = (SELECT comissao_percentual FROM usuarios WHERE id = comissoes_historico.tecnico_id),
--     valor_comissao = valor_servico * (SELECT comissao_percentual FROM usuarios WHERE id = comissoes_historico.tecnico_id) / 100.0
-- WHERE data_entrega >= date_trunc('month', CURRENT_DATE);

-- OPÇÃO 3: Ver histórico de mudanças por técnico
SELECT 
    u.nome as tecnico,
    u.comissao_percentual as percentual_atual,
    COUNT(ch.id) as total_comissoes,
    SUM(ch.valor_comissao) as total_pago,
    SUM(ch.valor_servico * u.comissao_percentual / 100.0) as total_se_recalcular,
    (SUM(ch.valor_servico * u.comissao_percentual / 100.0) - SUM(ch.valor_comissao)) as diferenca_total
FROM usuarios u
LEFT JOIN comissoes_historico ch ON ch.tecnico_id = u.id
WHERE u.nivel = 'tecnico'
GROUP BY u.id, u.nome, u.comissao_percentual;

-- OPÇÃO 4: Função para recalcular período específico (USE COM CUIDADO!)
CREATE OR REPLACE FUNCTION recalcular_comissoes_periodo(
    data_inicio DATE,
    data_fim DATE,
    tecnico_id_param UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    total_atualizadas INTEGER := 0;
BEGIN
    UPDATE comissoes_historico ch
    SET 
        percentual_comissao = u.comissao_percentual,
        valor_comissao = ch.valor_servico * u.comissao_percentual / 100.0
    FROM usuarios u
    WHERE u.id = ch.tecnico_id
    AND ch.data_entrega BETWEEN data_inicio AND data_fim
    AND (tecnico_id_param IS NULL OR ch.tecnico_id = tecnico_id_param);
    
    GET DIAGNOSTICS total_atualizadas = ROW_COUNT;
    
    RETURN 'Atualizadas ' || total_atualizadas || ' comissões no período.';
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função (NÃO EXECUTE SEM CONFIRMAR!):
-- SELECT recalcular_comissoes_periodo('2025-01-01', '2025-01-31');  -- Recalcular janeiro
-- SELECT recalcular_comissoes_periodo('2025-01-01', '2025-01-31', 'uuid-do-pedro');  -- Só Pedro
