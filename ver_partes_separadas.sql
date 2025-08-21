-- =====================================================
-- VER CADA PARTE SEPARADAMENTE
-- =====================================================

-- PARTE 1: Estrutura da tabela
SELECT 
  'ESTRUTURA' as secao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;
