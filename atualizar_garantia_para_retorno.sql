-- =====================================================
-- ATUALIZAR REGISTROS DE GARANTIA PARA RETORNO
-- =====================================================

-- Atualizar registros existentes que tenham tipo 'Garantia' para 'Retorno'
UPDATE ordens_servico 
SET tipo = 'Retorno' 
WHERE tipo = 'Garantia';

-- Verificar se há registros com tipo 'Garantia' restantes
SELECT COUNT(*) as registros_garantia_restantes
FROM ordens_servico 
WHERE tipo = 'Garantia';

-- Verificar distribuição atual dos tipos
SELECT 
    tipo,
    COUNT(*) as quantidade
FROM ordens_servico 
GROUP BY tipo
ORDER BY quantidade DESC; 