-- Tabela para controlar sessões múltiplas do mesmo usuário
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    device VARCHAR(50) NOT NULL,
    user_agent TEXT,
    screen VARCHAR(20),
    timezone VARCHAR(50),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_empresa_id ON user_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Tabela para controle de locks de edição
CREATE TABLE IF NOT EXISTS edit_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Índices para locks
CREATE INDEX IF NOT EXISTS idx_edit_locks_record ON edit_locks(record_id, table_name);
CREATE INDEX IF NOT EXISTS idx_edit_locks_user ON edit_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_empresa ON edit_locks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_active ON edit_locks(is_active);
CREATE INDEX IF NOT EXISTS idx_edit_locks_expires ON edit_locks(expires_at);

-- Função para limpar sessões inativas automaticamente
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    -- Marcar sessões inativas (mais de 30 minutos sem atividade)
    UPDATE user_sessions 
    SET is_active = false 
    WHERE last_activity < NOW() - INTERVAL '30 minutes' 
    AND is_active = true;
    
    -- Limpar locks expirados
    UPDATE edit_locks 
    SET is_active = false 
    WHERE expires_at < NOW() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_locks ENABLE ROW LEVEL SECURITY;

-- Política para user_sessions: usuário só pode ver suas próprias sessões
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para edit_locks: usuário só pode ver locks da sua empresa
CREATE POLICY "Users can view company locks" ON edit_locks
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company locks" ON edit_locks
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company locks" ON edit_locks
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- Função para obter estatísticas de sessões
CREATE OR REPLACE FUNCTION get_session_stats(user_uuid UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    active_sessions BIGINT,
    primary_session_id VARCHAR(255),
    oldest_session TIMESTAMP WITH TIME ZONE,
    newest_session TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_sessions,
        COUNT(*) FILTER (WHERE is_active)::BIGINT as active_sessions,
        (SELECT id FROM user_sessions 
         WHERE user_id = user_uuid AND is_active = true 
         ORDER BY created_at ASC LIMIT 1) as primary_session_id,
        MIN(created_at) as oldest_session,
        MAX(created_at) as newest_session
    FROM user_sessions 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar conflitos de edição
CREATE OR REPLACE FUNCTION check_edit_conflict(
    record_uuid VARCHAR(255),
    table_name VARCHAR(100),
    user_uuid UUID
)
RETURNS TABLE (
    has_conflict BOOLEAN,
    locked_by UUID,
    locked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(
            SELECT 1 FROM edit_locks 
            WHERE record_id = record_uuid 
            AND table_name = table_name 
            AND is_active = true 
            AND expires_at > NOW()
        ) as has_conflict,
        el.user_id as locked_by,
        el.created_at as locked_at,
        el.expires_at as expires_at
    FROM edit_locks el
    WHERE el.record_id = record_uuid 
    AND el.table_name = table_name 
    AND el.is_active = true 
    AND el.expires_at > NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE user_sessions IS 'Controla sessões múltiplas do mesmo usuário em diferentes dispositivos';
COMMENT ON TABLE edit_locks IS 'Controla locks de edição para evitar conflitos simultâneos';
COMMENT ON FUNCTION cleanup_inactive_sessions() IS 'Limpa sessões inativas e locks expirados automaticamente';
COMMENT ON FUNCTION get_session_stats(UUID) IS 'Retorna estatísticas de sessões do usuário';
COMMENT ON FUNCTION check_edit_conflict(VARCHAR, VARCHAR, UUID) IS 'Verifica se há conflito de edição em um registro';
