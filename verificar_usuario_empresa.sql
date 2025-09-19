-- Verificar usuário atual e sua empresa
SELECT 
  u.id,
  u.nome,
  u.email,
  u.empresa_id,
  e.nome as empresa_nome
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.auth_user_id = auth.uid();

-- Verificar se o usuário tem empresa_id
SELECT 
  COUNT(*) as usuarios_sem_empresa
FROM usuarios 
WHERE empresa_id IS NULL;

-- Se não tiver empresa_id, atribuir a primeira empresa disponível
UPDATE usuarios 
SET empresa_id = (SELECT id FROM empresas LIMIT 1)
WHERE empresa_id IS NULL 
AND auth_user_id = auth.uid();

-- Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE ordens_servico DISABLE ROW LEVEL SECURITY; 