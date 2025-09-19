-- Script para desabilitar RLS temporariamente para testar a bancada
-- Execute este script se houver problemas de permissão

-- 1. Desabilitar RLS na tabela ordens_servico
ALTER TABLE ordens_servico DISABLE ROW LEVEL SECURITY;

-- 2. Desabilitar RLS na tabela status_fixo
ALTER TABLE status_fixo DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se RLS foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables
WHERE tablename IN ('ordens_servico', 'status_fixo');

-- 4. Verificar se existem políticas RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies
WHERE tablename IN ('ordens_servico', 'status_fixo');

-- 5. Verificar se as tabelas estão acessíveis
SELECT 'Testando acesso à tabela status_fixo:' as info;
SELECT COUNT(*) as total_status FROM status_fixo;

SELECT 'Testando acesso à tabela ordens_servico:' as info;
SELECT COUNT(*) as total_ordens FROM ordens_servico;

-- 6. Verificar status fixos disponíveis
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