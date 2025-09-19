-- 🚨 DESABILITAR SISTEMA DE AUTO-LOGOUT TEMPORARIAMENTE
-- Este script desabilita o sistema de limpeza automática de sessões

-- 1. DESABILITAR TRIGGER DE LIMPEZA AUTOMÁTICA
DROP TRIGGER IF EXISTS trigger_cleanup_on_session_insert ON user_sessions;

-- 2. DESABILITAR TRIGGER DE SESSÃO ÚNICA
DROP TRIGGER IF EXISTS trigger_enforce_single_session ON user_sessions;

-- 3. DESABILITAR TRIGGER DE ATUALIZAÇÃO DE ATIVIDADE
DROP TRIGGER IF EXISTS trigger_update_last_activity ON user_sessions;

-- 4. COMENTAR FUNÇÃO DE LIMPEZA (não executar automaticamente)
COMMENT ON FUNCTION cleanup_inactive_sessions() IS 'DESABILITADA TEMPORARIAMENTE - Sistema de auto-logout removido';

-- 5. COMENTAR FUNÇÃO DE SESSÃO ÚNICA
COMMENT ON FUNCTION enforce_single_session() IS 'DESABILITADA TEMPORARIAMENTE - Permite múltiplas sessões';

-- 6. COMENTAR FUNÇÃO DE FORÇA LOGOUT
COMMENT ON FUNCTION force_user_logout(UUID) IS 'DESABILITADA TEMPORARIAMENTE - Não força logout automático';

-- 7. LOG DA DESABILITAÇÃO
INSERT INTO system_logs (action, details, created_at) 
VALUES (
    'disable_auto_logout', 
    'Sistema de auto-logout desabilitado temporariamente - Triggers removidos',
    NOW()
);

-- 8. VERIFICAR SE EXISTEM SESSÕES ATIVAS
SELECT 
    'Sessões ativas encontradas: ' || COUNT(*) as status
FROM user_sessions 
WHERE is_active = true;
