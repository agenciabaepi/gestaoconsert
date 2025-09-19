-- Nova estrutura simplificada para WhatsApp
-- Execute no Supabase Dashboard

-- 1. Remover tabela antiga (se existir)
DROP TABLE IF EXISTS public.whatsapp_config CASCADE;
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;

-- 2. Criar nova tabela simplificada
CREATE TABLE public.whatsapp_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero_whatsapp TEXT NOT NULL,
    nome_contato TEXT,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
    qr_code TEXT,
    session_data JSONB,
    ultima_conexao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id)
);

-- 3. Criar tabela de logs simplificada
CREATE TABLE public.whatsapp_mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tecnico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    numero_destino TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'erro')),
    os_id UUID REFERENCES public.ordens_servico(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices
CREATE INDEX idx_whatsapp_sessions_empresa ON public.whatsapp_sessions(empresa_id);
CREATE INDEX idx_whatsapp_mensagens_empresa ON public.whatsapp_mensagens(empresa_id);
CREATE INDEX idx_whatsapp_mensagens_tecnico ON public.whatsapp_mensagens(tecnico_id);

-- 5. Inserir configurações padrão para empresas existentes
INSERT INTO public.whatsapp_sessions (empresa_id, numero_whatsapp, status)
SELECT id, '', 'disconnected'
FROM public.empresas
WHERE NOT EXISTS (
  SELECT 1 FROM public.whatsapp_sessions ws WHERE ws.empresa_id = empresas.id
);

-- 6. Comentários para documentação
COMMENT ON TABLE public.whatsapp_sessions IS 'Sessões ativas do WhatsApp para cada empresa';
COMMENT ON COLUMN public.whatsapp_sessions.status IS 'Status da conexão: disconnected, connecting, connected, error';
COMMENT ON COLUMN public.whatsapp_sessions.qr_code IS 'QR Code para conexão (temporário)';
COMMENT ON COLUMN public.whatsapp_sessions.session_data IS 'Dados da sessão do WhatsApp Web';
COMMENT ON TABLE public.whatsapp_mensagens IS 'Log de mensagens enviadas via WhatsApp';
