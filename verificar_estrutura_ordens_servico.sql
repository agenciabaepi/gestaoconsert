-- Verificar estrutura real da tabela ordens_servico
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position;

-- Verificar se existe alguma coluna parecida com observações
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name ILIKE '%observ%';

-- Verificar se existe coluna de relato ou comentário
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND (column_name ILIKE '%relat%' OR column_name ILIKE '%coment%' OR column_name ILIKE '%nota%');
