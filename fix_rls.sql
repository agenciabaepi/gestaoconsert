-- Desabilitar RLS temporariamente
ALTER TABLE ordens_servico DISABLE ROW LEVEL SECURITY;

-- Verificar se usuário tem empresa_id
SELECT u.id, u.nome, u.empresa_id, e.nome as empresa_nome
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.auth_user_id = auth.uid();

-- Atribuir empresa_id se não tiver
UPDATE usuarios 
SET empresa_id = (SELECT id FROM empresas LIMIT 1)
WHERE empresa_id IS NULL;
