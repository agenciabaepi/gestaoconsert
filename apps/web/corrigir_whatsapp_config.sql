-- Corrigir a tabela whatsapp_config - Adicionar constraint única
-- Execute no Supabase Dashboard

-- 1. Adicionar constraint única na coluna empresa_id
ALTER TABLE public.whatsapp_config 
ADD CONSTRAINT whatsapp_config_empresa_id_unique 
UNIQUE (empresa_id);

-- 2. Verificar se a constraint foi criada
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'whatsapp_config' 
    AND tc.constraint_type = 'UNIQUE';

-- 3. Verificar se há dados duplicados (deve retornar 0)
SELECT empresa_id, COUNT(*) as total
FROM public.whatsapp_config
GROUP BY empresa_id
HAVING COUNT(*) > 1;

-- 4. Se houver duplicados, remover (execute apenas se necessário)
-- DELETE FROM public.whatsapp_config 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM public.whatsapp_config 
--     GROUP BY empresa_id
-- );

-- 5. Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'whatsapp_config'
ORDER BY ordinal_position;
