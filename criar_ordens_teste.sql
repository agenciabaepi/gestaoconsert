-- =====================================================
-- SCRIPT PARA CRIAR ORDENS DE SERVIÇO DE TESTE
-- Incluindo retornos para testar a nova funcionalidade
-- =====================================================

-- Primeiro, vamos adicionar o campo tipo se não existir
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Normal';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_tipo ON ordens_servico(tipo);

-- =====================================================
-- INSERIR ORDENS DE TESTE
-- =====================================================

-- Ordem Normal 1
INSERT INTO ordens_servico (
    numero_os,
    cliente_id,
    usuario_id,
    empresa_id,
    categoria,
    marca,
    modelo,
    servico,
    status,
    tipo,
    valor_servico,
    created_at
) VALUES (
    'OS001',
    (SELECT id FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Smartphone',
    'iPhone',
    'iPhone 13',
    'Troca de tela',
    'Concluído',
    'Normal',
    150.00,
    NOW() - INTERVAL '5 days'
);

-- Ordem Retorno 1 (Garantia)
INSERT INTO ordens_servico (
    numero_os,
    cliente_id,
    usuario_id,
    empresa_id,
    categoria,
    marca,
    modelo,
    servico,
    status,
    tipo,
    valor_servico,
    created_at
) VALUES (
    'OS002',
    (SELECT id FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Smartphone',
    'Samsung',
    'Galaxy S21',
    'Problema na bateria',
    'Em análise',
    'Retorno',
    80.00,
    NOW() - INTERVAL '2 days'
);

-- Ordem Normal 2
INSERT INTO ordens_servico (
    numero_os,
    cliente_id,
    usuario_id,
    empresa_id,
    categoria,
    marca,
    modelo,
    servico,
    status,
    tipo,
    valor_servico,
    created_at
) VALUES (
    'OS003',
    (SELECT id FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Notebook',
    'Dell',
    'Inspiron 15',
    'Limpeza e manutenção',
    'Concluído',
    'Normal',
    120.00,
    NOW() - INTERVAL '3 days'
);

-- Ordem Retorno 3 (Garantia)
INSERT INTO ordens_servico (
    numero_os,
    cliente_id,
    usuario_id,
    empresa_id,
    categoria,
    marca,
    modelo,
    servico,
    status,
    tipo,
    valor_servico,
    created_at
) VALUES (
    'OS004',
    (SELECT id FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Smartphone',
    'iPhone',
    'iPhone 12',
    'Defeito no carregamento',
    'Em análise',
    'Retorno',
    0.00,
    NOW() - INTERVAL '1 day'
);

-- Ordem Retorno 2 (Garantia)
INSERT INTO ordens_servico (
    numero_os,
    cliente_id,
    usuario_id,
    empresa_id,
    categoria,
    marca,
    modelo,
    servico,
    status,
    tipo,
    valor_servico,
    created_at
) VALUES (
    'OS005',
    (SELECT id FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Smartphone',
    'Xiaomi',
    'Redmi Note 10',
    'Problema no touch',
    'Aguardando peça',
    'Retorno',
    60.00,
    NOW()
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar ordens criadas
SELECT 
    numero_os,
    tipo,
    status,
    servico,
    valor_servico,
    created_at
FROM ordens_servico 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed'
ORDER BY created_at DESC;

-- Contar por tipo
SELECT 
    tipo,
    COUNT(*) as quantidade
FROM ordens_servico 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed'
GROUP BY tipo; 