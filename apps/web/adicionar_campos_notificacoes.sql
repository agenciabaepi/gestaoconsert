-- Adicionar campos na tabela notificacoes
ALTER TABLE public.notificacoes 
ADD COLUMN IF NOT EXISTS cliente_avisado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes
UPDATE public.notificacoes 
SET cliente_avisado = FALSE, lida = FALSE 
WHERE cliente_avisado IS NULL OR lida IS NULL;

-- Verificar se os campos foram criados
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notificacoes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
