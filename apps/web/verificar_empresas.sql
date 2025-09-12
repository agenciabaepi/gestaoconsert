-- Script para verificar a estrutura da tabela empresas

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'empresas'
) as tabela_existe;

-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'empresas'
ORDER BY ordinal_position;

-- Verificar dados de exemplo
SELECT 
  id,
  nome,
  status,
  motivoBloqueio,
  created_at
FROM empresas 
LIMIT 5;

-- Verificar se há empresas com o ID específico
SELECT 
  id,
  nome,
  status,
  motivoBloqueio
FROM empresas 
WHERE id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed'; 