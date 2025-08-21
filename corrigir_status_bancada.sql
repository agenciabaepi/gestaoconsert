-- Script para corrigir status da bancada
-- Execute este script para garantir que os status necessários existam

-- 1. Verificar se a tabela status_fixo existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_fixo') THEN
        CREATE TABLE status_fixo (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cor VARCHAR(7) NOT NULL,
            ordem INTEGER NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Inserir status fixos para OS se não existirem
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'ABERTA',
    '#f59e0b',
    1,
    'os'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'os' AND nome = 'ABERTA'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'EM ANÁLISE',
    '#3b82f6',
    2,
    'os'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'os' AND nome = 'EM ANÁLISE'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'AGUARDANDO PEÇA',
    '#f59e0b',
    3,
    'os'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'os' AND nome = 'AGUARDANDO PEÇA'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'CONCLUIDO',
    '#10b981',
    4,
    'os'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'os' AND nome = 'CONCLUIDO'
);

-- 3. Inserir status fixos para técnico se não existirem
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'AGUARDANDO INÍCIO',
    '#6b7280',
    1,
    'tecnico'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'tecnico' AND nome = 'AGUARDANDO INÍCIO'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'EM ANÁLISE',
    '#3b82f6',
    2,
    'tecnico'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'tecnico' AND nome = 'EM ANÁLISE'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'AGUARDANDO PEÇA',
    '#f59e0b',
    3,
    'tecnico'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'tecnico' AND nome = 'AGUARDANDO PEÇA'
);

INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'REPARO CONCLUÍDO',
    '#10b981',
    4,
    'tecnico'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo WHERE tipo = 'tecnico' AND nome = 'REPARO CONCLUÍDO'
);

-- 4. Verificar se os status foram inseridos corretamente
SELECT 'Status fixos para OS:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

SELECT 'Status fixos para técnico:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'tecnico'
ORDER BY ordem;

-- 5. Verificar se existem ordens de teste
SELECT 'Verificando ordens existentes:' as info;
SELECT COUNT(*) as total_ordens FROM ordens_servico;

SELECT 'Ordens com status ABERTA:' as info;
SELECT id, numero_os, status, status_tecnico
FROM ordens_servico
WHERE status = 'ABERTA'
LIMIT 5; 