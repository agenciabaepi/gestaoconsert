-- =====================================================
-- VERIFICAR O.S. PARA CALENDÁRIO
-- =====================================================

-- Verificar todas as O.S. da empresa
SELECT 
    id,
    numero_os,
    prazo_entrega,
    status,
    empresa_id,
    CASE 
        WHEN prazo_entrega IS NULL THEN 'NULL'
        WHEN prazo_entrega = '' THEN 'VAZIO'
        ELSE 'TEM_PRAZO'
    END as status_prazo,
    LENGTH(COALESCE(prazo_entrega::text, '')) as tamanho_prazo
FROM ordens_servico 
WHERE empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac'
ORDER BY numero_os;

-- Verificar O.S. com prazo definido
SELECT 
    id,
    numero_os,
    prazo_entrega,
    status,
    cliente_id
FROM ordens_servico 
WHERE empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac'
    AND prazo_entrega IS NOT NULL
    AND prazo_entrega != ''
ORDER BY prazo_entrega;

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
    AND column_name = 'prazo_entrega';

-- Contar O.S. por status de prazo
SELECT 
    CASE 
        WHEN prazo_entrega IS NULL THEN 'SEM_PRAZO'
        WHEN prazo_entrega = '' THEN 'PRAZO_VAZIO'
        ELSE 'COM_PRAZO'
    END as status_prazo,
    COUNT(*) as quantidade
FROM ordens_servico 
WHERE empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac'
GROUP BY 
    CASE 
        WHEN prazo_entrega IS NULL THEN 'SEM_PRAZO'
        WHEN prazo_entrega = '' THEN 'PRAZO_VAZIO'
        ELSE 'COM_PRAZO'
    END;
