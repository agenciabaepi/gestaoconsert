-- =====================================================
-- CRIAR DADOS DE TESTE PARA PLANOS E ASSINATURAS
-- =====================================================

-- 1. Inserir plano Trial se não existir
INSERT INTO planos (id, nome, descricao, preco, periodo, limite_usuarios, limite_produtos, limite_clientes, limite_fornecedores, recursos_disponiveis, ativo)
VALUES (
    gen_random_uuid(),
    'Trial',
    'Plano de teste gratuito por 15 dias',
    0.00,
    'monthly',
    5,
    50,
    100,
    10,
    '{"relatorios": true, "backup": true, "suporte": false}',
    true
) ON CONFLICT (nome) DO NOTHING;

-- 2. Inserir plano Básico se não existir
INSERT INTO planos (id, nome, descricao, preco, periodo, limite_usuarios, limite_produtos, limite_clientes, limite_fornecedores, recursos_disponiveis, ativo)
VALUES (
    gen_random_uuid(),
    'Básico',
    'Plano básico para pequenas empresas',
    29.90,
    'monthly',
    10,
    200,
    500,
    25,
    '{"relatorios": true, "backup": true, "suporte": true, "api": false}',
    true
) ON CONFLICT (nome) DO NOTHING;

-- 3. Inserir plano Pro se não existir
INSERT INTO planos (id, nome, descricao, preco, periodo, limite_usuarios, limite_produtos, limite_clientes, limite_fornecedores, recursos_disponiveis, ativo)
VALUES (
    gen_random_uuid(),
    'Pro',
    'Plano profissional para empresas em crescimento',
    59.90,
    'monthly',
    25,
    1000,
    2000,
    100,
    '{"relatorios": true, "backup": true, "suporte": true, "api": true, "integracao": true}',
    true
) ON CONFLICT (nome) DO NOTHING;

-- 4. Verificar se as empresas existentes têm assinatura
-- Se não tiverem, criar assinatura trial

-- Primeiro, vamos ver quais empresas não têm assinatura
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome
FROM empresas e
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE a.id IS NULL;

-- 5. Criar assinaturas trial para empresas sem assinatura
INSERT INTO assinaturas (
    empresa_id,
    plano_id,
    status,
    data_inicio,
    data_trial_fim,
    valor,
    created_at,
    updated_at
)
SELECT 
    e.id as empresa_id,
    (SELECT id FROM planos WHERE nome = 'Trial' LIMIT 1) as plano_id,
    'trial' as status,
    NOW() as data_inicio,
    NOW() + INTERVAL '15 days' as data_trial_fim,
    0.00 as valor,
    NOW() as created_at,
    NOW() as updated_at
FROM empresas e
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE a.id IS NULL;

-- 6. Verificar se as assinaturas foram criadas
SELECT 
    e.nome as empresa,
    a.status,
    a.data_inicio,
    a.data_trial_fim,
    p.nome as plano,
    p.preco
FROM empresas e
JOIN assinaturas a ON e.id = a.empresa_id
JOIN planos p ON a.plano_id = p.id
ORDER BY e.created_at DESC;

-- 7. Verificar quantas empresas ainda não têm assinatura
SELECT 
    COUNT(*) as empresas_sem_assinatura
FROM empresas e
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE a.id IS NULL;
