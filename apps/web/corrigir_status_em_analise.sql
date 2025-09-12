-- Script para corrigir o status EM ANÁLISE para tipo 'os'
-- O status existe apenas para 'tecnico', mas o código procura por 'os'

-- Verificar status existentes para tipo 'os'
SELECT 'Status existentes para tipo os:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

-- Verificar se já existe EM ANÁLISE para tipo 'os'
SELECT 'Verificando se EM ANÁLISE existe para tipo os:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os' AND nome = 'EM ANÁLISE';

-- Inserir EM ANÁLISE para tipo 'os' se não existir
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
    gen_random_uuid(),
    'EM ANÁLISE',
    '#3b82f6',
    2,
    'os'
WHERE NOT EXISTS (
    SELECT 1 FROM status_fixo 
    WHERE tipo = 'os' AND nome = 'EM ANÁLISE'
);

-- Verificar se foi inserido corretamente
SELECT 'Status para tipo os após correção:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

-- Verificar todos os status EM ANÁLISE
SELECT 'Todos os status EM ANÁLISE:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE nome = 'EM ANÁLISE'
ORDER BY tipo, ordem; 