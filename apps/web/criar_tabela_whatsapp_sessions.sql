-- =====================================================
-- CRIAR TABELA WHATSAPP_SESSIONS
-- =====================================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'whatsapp_sessions'
) as tabela_existe;

-- 2. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  numero_whatsapp TEXT,
  nome_contato TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_empresa_id ON whatsapp_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_updated_at ON whatsapp_sessions(updated_at);

-- 4. Adicionar comentários para documentação
COMMENT ON TABLE whatsapp_sessions IS 'Sessões ativas do WhatsApp por empresa';
COMMENT ON COLUMN whatsapp_sessions.empresa_id IS 'ID da empresa proprietária da sessão';
COMMENT ON COLUMN whatsapp_sessions.status IS 'Status da sessão: disconnected, connecting, qr_ready, connected';
COMMENT ON COLUMN whatsapp_sessions.qr_code IS 'QR Code para conexão (base64)';
COMMENT ON COLUMN whatsapp_sessions.numero_whatsapp IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN whatsapp_sessions.nome_contato IS 'Nome do contato conectado';

-- 5. Verificar se foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;

-- 6. Criar tabela de mensagens se não existir
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  numero_destino TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_simulated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_empresa_id ON whatsapp_messages(empresa_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- 8. Comentários para mensagens
COMMENT ON TABLE whatsapp_messages IS 'Mensagens enviadas via WhatsApp';
COMMENT ON COLUMN whatsapp_messages.empresa_id IS 'ID da empresa que enviou a mensagem';
COMMENT ON COLUMN whatsapp_messages.numero_destino IS 'Número de destino da mensagem';
COMMENT ON COLUMN whatsapp_messages.mensagem IS 'Conteúdo da mensagem';
COMMENT ON COLUMN whatsapp_messages.status IS 'Status da mensagem: pending, sent, failed';
COMMENT ON COLUMN whatsapp_messages.is_simulated IS 'Indica se a mensagem foi simulada';

-- 9. Verificar ambas as tabelas
SELECT 
  'whatsapp_sessions' as tabela,
  COUNT(*) as registros
FROM whatsapp_sessions
UNION ALL
SELECT 
  'whatsapp_messages' as tabela,
  COUNT(*) as registros
FROM whatsapp_messages;

-- 10. Testar inserção
INSERT INTO whatsapp_sessions (empresa_id, status, qr_code) 
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'test', 
  'test-qr'
) ON CONFLICT DO NOTHING;

-- 11. Verificar inserção
SELECT * FROM whatsapp_sessions WHERE empresa_id = '00000000-0000-0000-0000-000000000000';

-- 12. Limpar teste
DELETE FROM whatsapp_sessions WHERE empresa_id = '00000000-0000-0000-0000-000000000000';

-- Status: ✅ TABELAS CRIADAS
