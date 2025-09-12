-- Adicionar coluna tecnico_id na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tecnico_id UUID;

-- Mostrar estrutura atualizada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'auth_user_id', 'tecnico_id')
ORDER BY column_name;
