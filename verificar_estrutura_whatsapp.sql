-- Verificação detalhada da tabela whatsapp_config
-- Execute no Supabase Dashboard

-- 1. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_config'
) as tabela_existe;

-- 2. Verificar estrutura completa da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'whatsapp_config'
ORDER BY ordinal_position;

-- 3. Verificar se há registros
SELECT COUNT(*) as total_registros FROM whatsapp_config;

-- 4. Verificar se há registros para empresas específicas
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    wc.id as config_id,
    wc.ativo,
    wc.created_at
FROM empresas e
LEFT JOIN whatsapp_config wc ON e.id = wc.empresa_id
ORDER BY e.nome;

-- 5. Verificar permissões da tabela
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'whatsapp_config';

-- 6. Verificar se há constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'whatsapp_config';

-- 7. Tentar inserir um registro de teste (vai falhar se houver problema)
INSERT INTO whatsapp_config (
    empresa_id, 
    ativo, 
    whatsapp_token, 
    phone_number_id, 
    template_id, 
    mensagem_template
) VALUES (
    (SELECT id FROM empresas LIMIT 1),
    false,
    'teste_token',
    'teste_phone_id',
    'teste_template',
    'Mensagem de teste'
) ON CONFLICT (empresa_id) DO NOTHING
RETURNING *;
