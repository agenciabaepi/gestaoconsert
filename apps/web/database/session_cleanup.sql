-- Sistema de Limpeza Automática de Sessões e Cache
-- Implementa as melhores práticas do mercado para controle rigoroso de sessões

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

-- Trigger para limpeza automática (executa a cada 5 minutos)
CREATE OR REPLACE FUNCTION trigger_session_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    -- Executar limpeza apenas se passou pelo menos 5 minutos desde a última
    IF NOT EXISTS (
        SELECT 1 FROM system_logs 
        WHERE action = 'session_cleanup' 
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) THEN
        PERFORM cleanup_inactive_sessions();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpar sessões antigas quando nova sessão é criada
CREATE TRIGGER trigger_cleanup_on_session_insert
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_session_cleanup();

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

-- Índices para otimizar consultas de limpeza
CREATE INDEX IF NOT EXISTS idx_user_sessions_inactive_cleanup 
ON user_sessions(last_activity) 
WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_user_sessions_old_cleanup 
ON user_sessions(created_at) 
WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_edit_locks_expired_cleanup 
ON edit_locks(expires_at) 
WHERE is_active = true;

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

-- Comentários para documentação
COMMENT ON FUNCTION cleanup_inactive_sessions() IS 'Limpa sessões inativas, locks expirados e registra logs';
COMMENT ON FUNCTION force_user_logout(UUID) IS 'Força logout de todas as sessões de um usuário';
COMMENT ON FUNCTION get_company_session_stats(UUID) IS 'Retorna estatísticas de sessões por empresa';
COMMENT ON FUNCTION check_user_other_sessions(VARCHAR, UUID) IS 'Verifica se usuário tem outras sessões ativas';
COMMENT ON FUNCTION get_expiring_sessions(INTEGER) IS 'Retorna sessões que estão prestes a expirar';
