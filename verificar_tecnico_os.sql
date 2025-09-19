-- Script para verificar a estrutura da tabela ordens_servico e dados do técnico

-- 1. Verificar estrutura da tabela ordens_servico
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
  AND column_name IN ('id', 'tecnico_id', 'empresa_id', 'status')
ORDER BY ordinal_position;

-- 2. Verificar constraint da foreign key
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

-- 3. Verificar OS específica (substitua o ID pela OS que está dando erro)
SELECT 
  os.id,
  os.numero_os,
  os.tecnico_id,
  os.empresa_id,
  os.status,
  u.nome as tecnico_nome,
  u.nivel as tecnico_nivel
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.numero_os = '90';

-- 4. Verificar técnicos da empresa
SELECT 
  id,
  nome,
  email,
  nivel,
  empresa_id
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 5. Verificar se o técnico Pedro Oliveira existe
SELECT 
  id,
  nome,
  email,
  nivel,
  empresa_id
FROM usuarios 
WHERE nome ILIKE '%Pedro%' OR nome ILIKE '%Oliveira%'; 