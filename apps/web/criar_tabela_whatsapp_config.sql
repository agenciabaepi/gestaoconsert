-- Criar tabela para configurações do WhatsApp Cloud API
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT false,
    whatsapp_token TEXT,
    phone_number_id TEXT,
    template_id TEXT,
    mensagem_template TEXT DEFAULT 'Olá {nome_tecnico}! Um novo aparelho foi cadastrado para você: {marca} {modelo} - Cliente: {nome_cliente}. Acesse o sistema para mais detalhes.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por empresa
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_empresa ON public.whatsapp_config(empresa_id);

-- Inserir configuração padrão para empresas existentes (desativada)
INSERT INTO public.whatsapp_config (empresa_id, ativo, mensagem_template)
SELECT id, false, 'Olá {nome_tecnico}! Um novo aparelho foi cadastrado para você: {marca} {modelo} - Cliente: {nome_cliente}. Acesse o sistema para mais detalhes.'
FROM public.empresas
WHERE NOT EXISTS (
  SELECT 1 FROM public.whatsapp_config wc WHERE wc.empresa_id = empresas.id
);

-- Adicionar coluna para número do WhatsApp do técnico na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS whatsapp_numero TEXT;

-- Comentários para documentação
COMMENT ON TABLE public.whatsapp_config IS 'Configurações para envio automático de mensagens WhatsApp via Cloud API';
COMMENT ON COLUMN public.whatsapp_config.ativo IS 'Status de ativação do envio automático';
COMMENT ON COLUMN public.whatsapp_config.whatsapp_token IS 'Token de acesso da Meta Cloud API';
COMMENT ON COLUMN public.whatsapp_config.phone_number_id IS 'ID do número do WhatsApp Cloud';
COMMENT ON COLUMN public.whatsapp_config.template_id IS 'ID do template de mensagem aprovado na Meta';
COMMENT ON COLUMN public.whatsapp_config.mensagem_template IS 'Template da mensagem com variáveis para personalização';
COMMENT ON COLUMN public.usuarios.whatsapp_numero IS 'Número do WhatsApp do usuário (formato: 5511999999999)';
