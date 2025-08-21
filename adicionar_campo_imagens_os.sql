-- Adicionar campo imagens na tabela ordens_servico
-- Execute este script no Supabase Dashboard > SQL Editor

-- Verificar se o campo já existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'imagens';

-- Adicionar campo imagens se não existir
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS imagens TEXT;

-- Verificar se foi adicionado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
AND column_name = 'imagens';

-- Comentário sobre o campo
COMMENT ON COLUMN ordens_servico.imagens IS 'URLs das imagens separadas por vírgula (data URLs ou URLs do Supabase Storage)'; 