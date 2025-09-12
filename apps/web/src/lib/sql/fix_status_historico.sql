-- =====================================================
-- CORREÇÃO PARA SISTEMA DE HISTÓRICO DE STATUS
-- =====================================================

-- Primeiro, vamos desabilitar o trigger problemático
DROP TRIGGER IF EXISTS trg_status_historico ON ordens_servico;

-- Recriar a tabela status_historico se não existir
CREATE TABLE IF NOT EXISTS status_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  
  -- Status anterior e novo
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  status_tecnico_anterior VARCHAR(50),
  status_tecnico_novo VARCHAR(50),
  
  -- Dados do usuário que fez a mudança
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_status_historico_os_id ON status_historico(os_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_created_at ON status_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_historico_usuario_id ON status_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_status_novo ON status_historico(status_novo);
CREATE INDEX IF NOT EXISTS idx_status_historico_os_created ON status_historico(os_id, created_at DESC);

-- Função corrigida para registrar mudança de status
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

-- Por enquanto, NÃO vamos recriar o trigger automático
-- O registro será feito manualmente via aplicação para maior controle

-- Comentários para documentação
COMMENT ON TABLE status_historico IS 'Registra todas as mudanças de status das ordens de serviço para auditoria e análises';
COMMENT ON COLUMN status_historico.tempo_no_status_anterior IS 'Tempo que a OS ficou no status anterior antes desta mudança';
COMMENT ON COLUMN status_historico.motivo IS 'Motivo da mudança de status fornecido pelo usuário';
COMMENT ON FUNCTION registrar_mudanca_status IS 'Função para registrar mudanças de status com contexto completo';
