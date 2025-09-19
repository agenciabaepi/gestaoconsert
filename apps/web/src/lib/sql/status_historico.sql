-- =====================================================
-- TABELA DE HISTÓRICO DE STATUS
-- Sistema completo de rastreamento de mudanças
-- =====================================================

-- Tabela para registrar TODAS as mudanças de status das OS
CREATE TABLE IF NOT EXISTS status_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  
  -- Status anterior e novo
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  status_tecnico_anterior VARCHAR(50),
  status_tecnico_novo VARCHAR(50),
  
  -- Dados do usuário que fez a mudança
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nome VARCHAR(255), -- Cache do nome para relatórios
  
  -- Contexto da mudança
  motivo TEXT, -- Motivo da mudança (opcional)
  observacoes TEXT, -- Observações específicas
  
  -- Dados adicionais para análises
  tempo_no_status_anterior INTERVAL, -- Quanto tempo ficou no status anterior
  
  -- Metadados
  ip_address INET, -- IP de onde veio a mudança
  user_agent TEXT, -- Navegador/dispositivo
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT fk_status_historico_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_status_historico_os_id ON status_historico(os_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_created_at ON status_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_historico_usuario_id ON status_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_status_novo ON status_historico(status_novo);
CREATE INDEX IF NOT EXISTS idx_status_historico_os_created ON status_historico(os_id, created_at DESC);

-- =====================================================
-- VIEWS PARA ANÁLISES RÁPIDAS
-- =====================================================

-- View para últimas mudanças de status
CREATE OR REPLACE VIEW vw_ultimas_mudancas_status AS
SELECT 
  sh.*,
  os.numero_os,
  c.nome as cliente_nome,
  u.nome as usuario_nome_atual
FROM status_historico sh
JOIN ordens_servico os ON sh.os_id = os.id
JOIN clientes c ON os.cliente_id = c.id
LEFT JOIN usuarios u ON sh.usuario_id = u.id
ORDER BY sh.created_at DESC;

-- View para análise de tempo por status
CREATE OR REPLACE VIEW vw_tempo_por_status AS
SELECT 
  os_id,
  status_novo,
  status_anterior,
  created_at,
  LAG(created_at) OVER (PARTITION BY os_id ORDER BY created_at) as status_anterior_timestamp,
  created_at - LAG(created_at) OVER (PARTITION BY os_id ORDER BY created_at) as tempo_no_status
FROM status_historico
ORDER BY os_id, created_at;

-- View para métricas de produtividade
CREATE OR REPLACE VIEW vw_metricas_status AS
SELECT 
  DATE_TRUNC('day', created_at) as data,
  status_novo,
  COUNT(*) as quantidade_mudancas,
  COUNT(DISTINCT os_id) as os_afetadas,
  COUNT(DISTINCT usuario_id) as usuarios_ativos
FROM status_historico
GROUP BY DATE_TRUNC('day', created_at), status_novo
ORDER BY data DESC, status_novo;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR MUDANÇA DE STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_mudanca_status(
  p_os_id UUID,
  p_status_anterior VARCHAR(50),
  p_status_novo VARCHAR(50),
  p_status_tecnico_anterior VARCHAR(50),
  p_status_tecnico_novo VARCHAR(50),
  p_usuario_id UUID,
  p_motivo TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_historico_id UUID;
  v_usuario_nome VARCHAR(255);
  v_tempo_anterior INTERVAL;
BEGIN
  -- Buscar nome do usuário (pode ser NULL se usuário não existir)
  IF p_usuario_id IS NOT NULL THEN
    SELECT nome INTO v_usuario_nome FROM usuarios WHERE id = p_usuario_id;
  END IF;
  
  -- Se não encontrou o nome, usar um padrão
  IF v_usuario_nome IS NULL THEN
    v_usuario_nome := 'Sistema';
  END IF;
  
  -- Calcular tempo no status anterior
  SELECT 
    NOW() - MAX(created_at) 
  INTO v_tempo_anterior
  FROM status_historico 
  WHERE os_id = p_os_id;
  
  -- Inserir registro de histórico
  INSERT INTO status_historico (
    os_id,
    status_anterior,
    status_novo,
    status_tecnico_anterior,
    status_tecnico_novo,
    usuario_id,
    usuario_nome,
    motivo,
    observacoes,
    tempo_no_status_anterior,
    ip_address,
    user_agent
  ) VALUES (
    p_os_id,
    p_status_anterior,
    p_status_novo,
    p_status_tecnico_anterior,
    p_status_tecnico_novo,
    p_usuario_id,
    v_usuario_nome,
    p_motivo,
    p_observacoes,
    v_tempo_anterior,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_historico_id;
  
  RETURN v_historico_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA REGISTRO AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_registrar_mudanca_status()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Só registra se houve mudança real de status
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.status_tecnico IS DISTINCT FROM NEW.status_tecnico) THEN
    
    -- Usar usuario_id se existir, senão usar um usuário padrão do sistema
    v_usuario_id := COALESCE(NEW.usuario_id, OLD.usuario_id);
    
    -- Se ainda não temos usuario_id, buscar o primeiro usuário da empresa
    IF v_usuario_id IS NULL THEN
      SELECT id INTO v_usuario_id 
      FROM usuarios 
      WHERE empresa_id = NEW.empresa_id 
      LIMIT 1;
    END IF;
    
    -- Se ainda não encontrou, criar um registro com usuário NULL (sistema)
    IF v_usuario_id IS NOT NULL THEN
      PERFORM registrar_mudanca_status(
        NEW.id,
        OLD.status,
        NEW.status,
        OLD.status_tecnico,
        NEW.status_tecnico,
        v_usuario_id,
        'Mudança automática via trigger',
        NULL,
        NULL,
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela ordens_servico
DROP TRIGGER IF EXISTS trg_status_historico ON ordens_servico;
CREATE TRIGGER trg_status_historico
  AFTER UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION trigger_registrar_mudanca_status();

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE status_historico IS 'Registra todas as mudanças de status das ordens de serviço para auditoria e análises';
COMMENT ON COLUMN status_historico.tempo_no_status_anterior IS 'Tempo que a OS ficou no status anterior antes desta mudança';
COMMENT ON COLUMN status_historico.motivo IS 'Motivo da mudança de status fornecido pelo usuário';
COMMENT ON COLUMN status_historico.ip_address IS 'IP de onde veio a mudança para auditoria';
COMMENT ON FUNCTION registrar_mudanca_status IS 'Função para registrar mudanças de status com contexto completo';
