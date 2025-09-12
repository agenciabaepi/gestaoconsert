-- Verificar se o campo imagens existe na tabela ordens_servico
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'imagens';

-- Verificar estrutura completa da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position;
