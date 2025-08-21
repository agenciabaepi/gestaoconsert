-- Script para verificar o técnico Pedro Oliveira

-- 1. Verificar se Pedro Oliveira existe na tabela usuarios
SELECT 
  id,
  nome,
  email,
  nivel,
  empresa_id
FROM usuarios 
WHERE nome ILIKE '%Pedro%' OR nome ILIKE '%Oliveira%'
ORDER BY nome;

-- 2. Verificar todos os técnicos da empresa
SELECT 
  id,
  nome,
  email,
  nivel,
  empresa_id
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 3. Verificar a OS #90 e seu técnico atual
SELECT 
  os.id,
  os.numero_os,
  os.tecnico_id,
  os.empresa_id,
  u.nome as tecnico_nome,
  u.id as tecnico_id_correto
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.numero_os = '90';

-- 4. Verificar se há algum problema com a constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'ordens_servico'
  AND kcu.column_name = 'tecnico_id'; 