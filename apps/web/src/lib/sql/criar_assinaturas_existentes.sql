-- =====================================================
-- CRIAR ASSINATURAS TRIAL PARA EMPRESAS EXISTENTES
-- =====================================================

-- 1. Verificar empresas que não têm assinatura
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    e.email as empresa_email,
    e.created_at as empresa_criada_em
FROM empresas e
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE a.id IS NULL;

-- 2. Obter o ID do plano Trial
SELECT id, nome FROM planos WHERE nome = 'Trial';

-- 3. Criar assinaturas trial para empresas sem assinatura
-- (Substitua 'PLANO_TRIAL_ID' pelo ID real do plano Trial)

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

-- 4. Verificar se as assinaturas foram criadas
SELECT 
    e.nome as empresa,
    a.status,
    a.data_inicio,
    a.data_trial_fim,
    p.nome as plano
FROM empresas e
JOIN assinaturas a ON e.id = a.empresa_id
JOIN planos p ON a.plano_id = p.id
ORDER BY e.created_at DESC;

-- 5. Verificar quantas empresas ainda não têm assinatura
SELECT 
    COUNT(*) as empresas_sem_assinatura
FROM empresas e
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE a.id IS NULL; 