-- Verificar se a tabela whatsapp_config existe e tem dados
-- Execute no Supabase Dashboard

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_config'
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela
SELECT 
    id,
    empresa_id,
    ativo,
    whatsapp_token IS NOT NULL as tem_token,
    phone_number_id IS NOT NULL as tem_phone_id,
    template_id IS NOT NULL as tem_template,
    created_at,
    updated_at
FROM whatsapp_config
ORDER BY created_at DESC;

-- 3. Verificar se a empresa atual tem configuração
-- Substitua 'SUA_EMPRESA_ID' pelo ID real da sua empresa
SELECT 
    e.nome as empresa_nome,
    wc.*
FROM empresas e
LEFT JOIN whatsapp_config wc ON e.id = wc.empresa_id
WHERE e.id = 'SUA_EMPRESA_ID'; -- Substitua pelo ID real

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_config'
ORDER BY ordinal_position;
