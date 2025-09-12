-- Script para testar se a coluna senha_acesso está funcionando
-- Execute este script no Supabase para verificar

-- 1. Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'senha_acesso';

-- 2. Verificar algumas OS e suas senhas
SELECT id, numero_os, senha_acesso, created_at
FROM ordens_servico 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar se há OS sem senha
SELECT COUNT(*) as total_sem_senha
FROM ordens_servico 
WHERE senha_acesso IS NULL OR senha_acesso = '';

-- 4. Verificar se há senhas duplicadas
SELECT senha_acesso, COUNT(*) as quantidade
FROM ordens_servico 
WHERE senha_acesso IS NOT NULL
GROUP BY senha_acesso
HAVING COUNT(*) > 1;
