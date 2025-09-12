-- Script para configurar o sistema de onboarding
-- Execute este script no seu banco Supabase

-- 1. Criar tabela de status do onboarding
CREATE TABLE IF NOT EXISTS onboarding_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status_user_id ON onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status_empresa_id ON onboarding_status(empresa_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status_completed ON onboarding_status(completed);

-- 3. Criar política RLS (Row Level Security)
ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;

-- 4. Política para usuários verem apenas seus próprios registros
CREATE POLICY "Users can view own onboarding status" ON onboarding_status
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- 5. Política para usuários inserirem/atualizarem seus próprios registros
CREATE POLICY "Users can insert own onboarding status" ON onboarding_status
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own onboarding status" ON onboarding_status
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para atualizar updated_at
CREATE TRIGGER update_onboarding_status_updated_at 
  BEFORE UPDATE ON onboarding_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Comentários para documentação
COMMENT ON TABLE onboarding_status IS 'Tabela para controlar o status do onboarding dos usuários';
COMMENT ON COLUMN onboarding_status.user_id IS 'ID do usuário autenticado';
COMMENT ON COLUMN onboarding_status.empresa_id IS 'ID da empresa do usuário';
COMMENT ON COLUMN onboarding_status.completed IS 'Se o onboarding foi concluído';
COMMENT ON COLUMN onboarding_status.completed_at IS 'Data/hora de conclusão do onboarding';
