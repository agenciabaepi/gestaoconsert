-- Script para verificar a estrutura da tabela status_fixo
-- Execute este script primeiro para ver quais colunas existem

-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'status_fixo'
ORDER BY ordinal_position;

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'status_fixo'
) as tabela_existe;

-- Verificar dados atuais (se houver)
SELECT COUNT(*) as total_registros FROM status_fixo;

-- Verificar dados por tipo
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM status_fixo
GROUP BY tipo
ORDER BY tipo; 