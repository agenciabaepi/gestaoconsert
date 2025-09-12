-- =====================================================
-- REMOVER COLUNAS ANTIGAS DE CATEGORIAS
-- =====================================================

-- Remover colunas antigas de texto das categorias
-- Estas colunas não são mais necessárias pois agora usamos os IDs

ALTER TABLE produtos_servicos DROP COLUMN IF EXISTS grupo;
ALTER TABLE produtos_servicos DROP COLUMN IF EXISTS categoria;
ALTER TABLE produtos_servicos DROP COLUMN IF EXISTS subcategoria;

-- =====================================================
-- VERIFICAR ESTRUTURA ATUAL
-- =====================================================

-- Comando para verificar a estrutura atual da tabela
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'produtos_servicos' 
-- ORDER BY ordinal_position;

-- =====================================================
-- COLUNAS QUE DEVEM PERMANECER
-- =====================================================

-- Colunas de categoria por ID (novas):
-- - grupo_id (UUID, REFERENCES grupos_produtos(id))
-- - categoria_id (UUID, REFERENCES categorias_produtos(id))
-- - subcategoria_id (UUID, REFERENCES subcategorias_produtos(id))

-- Outras colunas importantes:
-- - id, nome, tipo, codigo, preco, custo, etc. 