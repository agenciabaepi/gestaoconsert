-- =====================================================
-- ATUALIZAR QUERIES PARA USAR NOVAS TABELAS DE CATEGORIAS
-- =====================================================

-- =====================================================
-- EXEMPLOS DE QUERIES ATUALIZADAS
-- =====================================================

-- 1. Query para buscar produtos com nomes das categorias
/*
SELECT 
  ps.*,
  gp.nome as grupo_nome,
  cp.nome as categoria_nome,
  scp.nome as subcategoria_nome
FROM produtos_servicos ps
LEFT JOIN grupos_produtos gp ON ps.grupo_id = gp.id
LEFT JOIN categorias_produtos cp ON ps.categoria_id = cp.id
LEFT JOIN subcategorias_produtos scp ON ps.subcategoria_id = scp.id
WHERE ps.empresa_id = 'seu_empresa_id'
ORDER BY ps.nome;
*/

-- 2. Query para buscar produtos por categoria
/*
SELECT 
  ps.*,
  cp.nome as categoria_nome
FROM produtos_servicos ps
LEFT JOIN categorias_produtos cp ON ps.categoria_id = cp.id
WHERE ps.empresa_id = 'seu_empresa_id'
  AND cp.nome ILIKE '%categoria_desejada%'
ORDER BY ps.nome;
*/

-- 3. Query para buscar produtos por grupo
/*
SELECT 
  ps.*,
  gp.nome as grupo_nome
FROM produtos_servicos ps
LEFT JOIN grupos_produtos gp ON ps.grupo_id = gp.id
WHERE ps.empresa_id = 'seu_empresa_id'
  AND gp.nome ILIKE '%grupo_desejado%'
ORDER BY ps.nome;
*/

-- 4. Query para estatísticas por categoria
/*
SELECT 
  cp.nome as categoria_nome,
  COUNT(ps.id) as total_produtos,
  AVG(ps.preco) as preco_medio
FROM produtos_servicos ps
LEFT JOIN categorias_produtos cp ON ps.categoria_id = cp.id
WHERE ps.empresa_id = 'seu_empresa_id'
GROUP BY cp.id, cp.nome
ORDER BY total_produtos DESC;
*/

-- =====================================================
-- FUNÇÃO PARA OBTER NOME COMPLETO DA CATEGORIA
-- =====================================================

-- Função para obter o nome completo da categoria de um produto
CREATE OR REPLACE FUNCTION get_categoria_completa(produto_id UUID)
RETURNS TEXT AS $$
DECLARE
  resultado TEXT;
BEGIN
  SELECT 
    COALESCE(gp.nome || ' > ' || cp.nome || ' > ' || scp.nome,
             gp.nome || ' > ' || cp.nome,
             gp.nome,
             'Sem categoria')
  INTO resultado
  FROM produtos_servicos ps
  LEFT JOIN grupos_produtos gp ON ps.grupo_id = gp.id
  LEFT JOIN categorias_produtos cp ON ps.categoria_id = cp.id
  LEFT JOIN subcategorias_produtos scp ON ps.subcategoria_id = scp.id
  WHERE ps.id = produto_id;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW PARA PRODUTOS COM CATEGORIAS
-- =====================================================

-- View para facilitar consultas de produtos com categorias
CREATE OR REPLACE VIEW produtos_com_categorias AS
SELECT 
  ps.*,
  gp.nome as grupo_nome,
  cp.nome as categoria_nome,
  scp.nome as subcategoria_nome,
  COALESCE(gp.nome || ' > ' || cp.nome || ' > ' || scp.nome,
           gp.nome || ' > ' || cp.nome,
           gp.nome,
           'Sem categoria') as categoria_completa
FROM produtos_servicos ps
LEFT JOIN grupos_produtos gp ON ps.grupo_id = gp.id
LEFT JOIN categorias_produtos cp ON ps.categoria_id = cp.id
LEFT JOIN subcategorias_produtos scp ON ps.subcategoria_id = scp.id;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para melhorar performance das queries com JOINs
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_grupo_id ON produtos_servicos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_categoria_id ON produtos_servicos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_subcategoria_id ON produtos_servicos(subcategoria_id);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION get_categoria_completa(UUID) IS 'Retorna o nome completo da categoria de um produto (Grupo > Categoria > Subcategoria)';
COMMENT ON VIEW produtos_com_categorias IS 'View para facilitar consultas de produtos com suas categorias completas'; 