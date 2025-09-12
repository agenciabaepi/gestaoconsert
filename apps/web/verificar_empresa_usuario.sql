-- Verificar se o usuário atual tem empresa_id
SELECT 
  u.id,
  u.nome,
  u.email,
  u.empresa_id,
  e.nome as empresa_nome,
  e.cnpj as empresa_cnpj
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.auth_user_id = auth.uid();

-- Verificar se existem usuários sem empresa_id
SELECT 
  id,
  nome,
  email,
  empresa_id,
  auth_user_id
FROM usuarios 
WHERE empresa_id IS NULL;

-- Verificar estrutura da tabela ordens_servico
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name IN ('empresa_id', 'cliente_id', 'tecnico_id', 'atendente')
ORDER BY ordinal_position; 