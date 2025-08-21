-- =====================================================
-- SCRIPT PARA CRIAR 14 CLIENTES ALEATÓRIOS (CORRIGIDO)
-- Para testar os limites do plano Trial (15 clientes)
-- =====================================================

-- Empresa ID: 22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed
-- Script para criar 14 clientes de teste para esta empresa

-- =====================================================
-- CLIENTES ALEATÓRIOS PARA TESTE
-- =====================================================

INSERT INTO clientes (
    empresa_id,
    nome,
    telefone,
    celular,
    email,
    documento,
    tipo,
    observacoes,
    responsavel,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    origem,
    status,
    numero_cliente,
    cadastrado_por,
    data_cadastro,
    created_at
) VALUES 
-- Cliente 1
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'João Silva Santos',
    '(11) 3333-4444',
    '(11) 99999-1111',
    'joao.silva@email.com',
    '123.456.789-01',
    'pf',
    'Cliente preferencial, sempre paga em dia',
    'Maria Atendente',
    '01234-567',
    'Rua das Flores',
    '123',
    'Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    'Indicação',
    'ativo',
    1,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 2
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Maria Oliveira Costa',
    '(11) 4444-5555',
    '(11) 99999-2222',
    'maria.oliveira@email.com',
    '234.567.890-12',
    'pf',
    'Cliente novo, primeira compra',
    'João Atendente',
    '02345-678',
    'Av. Paulista',
    '456',
    'Sala 12',
    'Bela Vista',
    'São Paulo',
    'SP',
    'Site',
    'ativo',
    2,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 3
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Pedro Santos Lima',
    '(11) 5555-6666',
    '(11) 99999-3333',
    'pedro.santos@email.com',
    '345.678.901-23',
    'pf',
    'Cliente recorrente',
    'Ana Atendente',
    '03456-789',
    'Rua Augusta',
    '789',
    'Loja 3',
    'Consolação',
    'São Paulo',
    'SP',
    'Google',
    'ativo',
    3,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 4
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Ana Costa Pereira',
    '(11) 6666-7777',
    '(11) 99999-4444',
    'ana.costa@email.com',
    '456.789.012-34',
    'pf',
    'Cliente VIP',
    'Carlos Atendente',
    '04567-890',
    'Rua Oscar Freire',
    '321',
    'Apto 78',
    'Jardins',
    'São Paulo',
    'SP',
    'Indicação',
    'ativo',
    4,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 5
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Carlos Lima Silva',
    '(11) 7777-8888',
    '(11) 99999-5555',
    'carlos.lima@email.com',
    '567.890.123-45',
    'pf',
    'Cliente empresarial',
    'Fernanda Atendente',
    '05678-901',
    'Av. Brigadeiro Faria Lima',
    '654',
    'Andar 15',
    'Itaim Bibi',
    'São Paulo',
    'SP',
    'LinkedIn',
    'ativo',
    5,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 6
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Fernanda Pereira Costa',
    '(11) 8888-9999',
    '(11) 99999-6666',
    'fernanda.pereira@email.com',
    '678.901.234-56',
    'pf',
    'Cliente residencial',
    'Roberto Atendente',
    '06789-012',
    'Rua Teodoro Sampaio',
    '987',
    'Casa',
    'Pinheiros',
    'São Paulo',
    'SP',
    'Facebook',
    'ativo',
    6,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 7
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Roberto Silva Oliveira',
    '(11) 9999-0000',
    '(11) 99999-7777',
    'roberto.silva@email.com',
    '789.012.345-67',
    'pf',
    'Cliente técnico',
    'Patrícia Atendente',
    '07890-123',
    'Rua Harmonia',
    '147',
    'Apto 23',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'Instagram',
    'ativo',
    7,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 8
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Patrícia Costa Santos',
    '(11) 0000-1111',
    '(11) 99999-8888',
    'patricia.costa@email.com',
    '890.123.456-78',
    'pf',
    'Cliente premium',
    'Ricardo Atendente',
    '08901-234',
    'Rua Aspicuelta',
    '258',
    'Loja 5',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'Indicação',
    'ativo',
    8,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 9
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Ricardo Oliveira Lima',
    '(11) 1111-2222',
    '(11) 99999-9999',
    'ricardo.oliveira@email.com',
    '901.234.567-89',
    'pf',
    'Cliente corporativo',
    'Sandra Atendente',
    '09012-345',
    'Av. Rebouças',
    '369',
    'Sala 8',
    'Pinheiros',
    'São Paulo',
    'SP',
    'Site',
    'ativo',
    9,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 10
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Sandra Lima Costa',
    '(11) 2222-3333',
    '(11) 88888-0000',
    'sandra.lima@email.com',
    '012.345.678-90',
    'pf',
    'Cliente residencial',
    'Marcelo Atendente',
    '00123-456',
    'Rua Cardeal Arcoverde',
    '741',
    'Apto 56',
    'Pinheiros',
    'São Paulo',
    'SP',
    'Google',
    'ativo',
    10,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 11
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Marcelo Costa Silva',
    '(11) 3333-4444',
    '(11) 88888-1111',
    'marcelo.costa@email.com',
    '123.456.789-01',
    'pf',
    'Cliente técnico',
    'Juliana Atendente',
    '01234-567',
    'Rua Corifeu de Azevedo Marques',
    '852',
    'Casa 2',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'Indicação',
    'ativo',
    11,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 12
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Juliana Silva Pereira',
    '(11) 4444-5555',
    '(11) 88888-2222',
    'juliana.silva@email.com',
    '234.567.890-12',
    'pf',
    'Cliente empresarial',
    'Thiago Atendente',
    '02345-678',
    'Rua Fradique Coutinho',
    '963',
    'Loja 10',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'LinkedIn',
    'ativo',
    12,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 13
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Thiago Pereira Lima',
    '(11) 5555-6666',
    '(11) 88888-3333',
    'thiago.pereira@email.com',
    '345.678.901-23',
    'pf',
    'Cliente VIP',
    'Camila Atendente',
    '03456-789',
    'Rua Wisard',
    '159',
    'Apto 89',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'Facebook',
    'ativo',
    13,
    'Sistema',
    NOW(),
    NOW()
),

-- Cliente 14
(
    '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
    'Camila Lima Costa',
    '(11) 6666-7777',
    '(11) 88888-4444',
    'camila.lima@email.com',
    '456.789.012-34',
    'pf',
    'Cliente premium',
    'Diego Atendente',
    '04567-890',
    'Rua Mourato Coelho',
    '753',
    'Sala 15',
    'Vila Madalena',
    'São Paulo',
    'SP',
    'Instagram',
    'ativo',
    14,
    'Sistema',
    NOW(),
    NOW()
);

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

-- 1. Execute este script para criar os 14 clientes

-- 2. Teste o limite criando o 15º cliente (deve ser bloqueado)

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Para verificar se os clientes foram criados:
-- SELECT COUNT(*) as total_clientes FROM clientes WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed';

-- Para ver os clientes criados:
-- SELECT nome, telefone, email, status, numero_cliente 
-- FROM clientes 
-- WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' 
-- ORDER BY numero_cliente; 