-- Script completo para criar tabelas de sessões
-- Execute este script no Supabase SQL Editor

-- 1. TABELA DE SESSÕES DE USUÁRIO
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

-- 2. TABELA DE LOCKS DE EDIÇÃO
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

-- 3. TABELA DE LOGS DO SISTEMA (se não existir)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_empresa_id ON user_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_inactive_cleanup ON user_sessions(last_activity) WHERE is_active = false;
CREATE INDEX IF NOT EXISTS idx_user_sessions_old_cleanup ON user_sessions(created_at) WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_edit_locks_record ON edit_locks(record_id, table_name);
CREATE INDEX IF NOT EXISTS idx_edit_locks_user ON edit_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_empresa ON edit_locks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_active ON edit_locks(is_active);
CREATE INDEX IF NOT EXISTS idx_edit_locks_expires ON edit_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_edit_locks_expired_cleanup ON edit_locks(expires_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);

-- 5. TRIGGERS E FUNÇÕES
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

-- Trigger para atualizar last_activity automaticamente
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_activity
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

-- Política para limitar número de sessões por usuário (máximo 1)
CREATE OR REPLACE FUNCTION enforce_single_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Se já existe uma sessão ativa para este usuário, marcar como inativa
    IF NEW.is_active = true THEN
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_single_session
    BEFORE INSERT OR UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_session();

-- 6. FUNÇÕES DE LIMPEZA
-- Função para limpeza automática de sessões inativas
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    -- 1. DERROBAR SESSÕES INATIVAS (mais de 1 hora sem atividade)
    UPDATE user_sessions 
    SET is_active = false 
    WHERE last_activity < NOW() - INTERVAL '1 hour' 
    AND is_active = true;
    
    -- 2. LIMPAR LOCKS EXPIRADOS (mais de 30 minutos)
    UPDATE edit_locks 
    SET is_active = false 
    WHERE expires_at < NOW() 
    AND is_active = true;
    
    -- 3. LIMPAR SESSÕES ANTIGAS (mais de 24 horas)
    DELETE FROM user_sessions 
    WHERE created_at < NOW() - INTERVAL '24 hours' 
    AND is_active = false;
    
    -- 4. LIMPAR LOCKS ANTIGOS (mais de 24 horas)
    DELETE FROM edit_locks 
    WHERE created_at < NOW() - INTERVAL '24 hours' 
    AND is_active = false;
    
    -- 5. LOG DA LIMPEZA
    INSERT INTO system_logs (action, details, created_at) 
    VALUES (
        'session_cleanup', 
        'Limpeza automática de sessões executada: ' || 
        (SELECT COUNT(*) FROM user_sessions WHERE is_active = true) || ' sessões ativas',
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Função para forçar logout de usuário específico
CREATE OR REPLACE FUNCTION force_user_logout(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Marcar todas as sessões do usuário como inativas
    UPDATE user_sessions 
    SET is_active = false 
    WHERE user_id = user_uuid;
    
    -- Limpar todos os locks do usuário
    UPDATE edit_locks 
    SET is_active = false 
    WHERE user_id = user_uuid;
    
    -- Log da ação
    INSERT INTO system_logs (action, details, created_at) 
    VALUES (
        'force_logout', 
        'Logout forçado para usuário: ' || user_uuid,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de sessões por empresa
CREATE OR REPLACE FUNCTION get_company_session_stats(empresa_uuid UUID)
RETURNS TABLE (
    total_users BIGINT,
    active_sessions BIGINT,
    inactive_sessions BIGINT,
    oldest_session TIMESTAMP WITH TIME ZONE,
    newest_session TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT us.user_id)::BIGINT as total_users,
        COUNT(*) FILTER (WHERE us.is_active)::BIGINT as active_sessions,
        COUNT(*) FILTER (WHERE NOT us.is_active)::BIGINT as inactive_sessions,
        MIN(us.created_at) as oldest_session,
        MAX(us.created_at) as newest_session
    FROM user_sessions us
    WHERE us.empresa_id = empresa_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está logado em outro dispositivo
CREATE OR REPLACE FUNCTION check_user_other_sessions(current_session_id VARCHAR, user_uuid UUID)
RETURNS TABLE (
    has_other_sessions BOOLEAN,
    session_count BIGINT,
    devices TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) > 0 as has_other_sessions,
        COUNT(*)::BIGINT as session_count,
        ARRAY_AGG(us.device) as devices
    FROM user_sessions us
    WHERE us.user_id = user_uuid 
    AND us.is_active = true 
    AND us.id != current_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter sessões que estão prestes a expirar
CREATE OR REPLACE FUNCTION get_expiring_sessions(warning_minutes INTEGER DEFAULT 5)
RETURNS TABLE (
    session_id VARCHAR(255),
    user_id UUID,
    device VARCHAR(50),
    last_activity TIMESTAMP WITH TIME ZONE,
    minutes_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.device,
        us.last_activity,
        EXTRACT(EPOCH FROM (us.last_activity + INTERVAL '1 hour' - NOW())) / 60::INTEGER as minutes_until_expiry
    FROM user_sessions us
    WHERE us.is_active = true 
    AND us.last_activity < NOW() - INTERVAL '1 hour - ' || warning_minutes || ' minutes'
    ORDER BY us.last_activity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

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

-- Política para system_logs: usuário só pode ver logs da sua empresa
CREATE POLICY "Users can view company logs" ON system_logs
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can insert logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE user_sessions IS 'Controla sessões únicas do usuário em diferentes dispositivos';
COMMENT ON TABLE edit_locks IS 'Controla locks de edição para evitar conflitos simultâneos';
COMMENT ON TABLE system_logs IS 'Logs do sistema para auditoria e monitoramento';
COMMENT ON FUNCTION cleanup_inactive_sessions() IS 'Limpa sessões inativas, locks expirados e registra logs';
COMMENT ON FUNCTION force_user_logout(UUID) IS 'Força logout de todas as sessões de um usuário';
COMMENT ON FUNCTION get_company_session_stats(UUID) IS 'Retorna estatísticas de sessões por empresa';
COMMENT ON FUNCTION check_user_other_sessions(VARCHAR, UUID) IS 'Verifica se usuário tem outras sessões ativas';
COMMENT ON FUNCTION get_expiring_sessions(INTEGER) IS 'Retorna sessões que estão prestes a expirar';

-- 9. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE 'Tabelas de sessões criadas com sucesso!';
    RAISE NOTICE 'user_sessions: %', (SELECT COUNT(*) FROM user_sessions);
    RAISE NOTICE 'edit_locks: %', (SELECT COUNT(*) FROM edit_locks);
    RAISE NOTICE 'system_logs: %', (SELECT COUNT(*) FROM system_logs);
END $$;
