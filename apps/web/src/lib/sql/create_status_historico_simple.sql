-- =====================================================
-- CRIAR TABELA HISTÓRICO DE STATUS - VERSÃO SIMPLES
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- Criar tabela status_historico
CREATE TABLE IF NOT EXISTS status_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL,
  
  -- Status anterior e novo
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  status_tecnico_anterior VARCHAR(50),
  status_tecnico_novo VARCHAR(50),
  
  -- Dados do usuário que fez a mudança
  usuario_id UUID,
  usuario_nome VARCHAR(255),
  
  -- Contexto da mudança
  motivo TEXT,
  observacoes TEXT,
  
  -- Dados adicionais
  tempo_no_status_anterior INTERVAL,
  
  -- Metadados
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_status_historico_os_id ON status_historico(os_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_created_at ON status_historico(created_at DESC);

-- Adicionar foreign key constraint se a tabela ordens_servico existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordens_servico') THEN
    ALTER TABLE status_historico 
    ADD CONSTRAINT fk_status_historico_os 
    FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar foreign key constraint se a tabela usuarios existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    ALTER TABLE status_historico 
    ADD CONSTRAINT fk_status_historico_usuario 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comentários
COMMENT ON TABLE status_historico IS 'Registra todas as mudanças de status das ordens de serviço';
COMMENT ON COLUMN status_historico.tempo_no_status_anterior IS 'Tempo que a OS ficou no status anterior';
COMMENT ON COLUMN status_historico.motivo IS 'Motivo da mudança de status';

-- Verificar se a tabela foi criada
SELECT 'Tabela status_historico criada com sucesso!' as resultado;
