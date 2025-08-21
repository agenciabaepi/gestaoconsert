-- Criar tabela termos_garantia
CREATE TABLE IF NOT EXISTS termos_garantia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_termos_garantia_empresa_id ON termos_garantia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_termos_garantia_ativo ON termos_garantia(ativo);
CREATE INDEX IF NOT EXISTS idx_termos_garantia_ordem ON termos_garantia(ordem);

-- Habilitar RLS (Row Level Security)
ALTER TABLE termos_garantia ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas aos usuários da empresa
CREATE POLICY "Usuários podem ver termos da própria empresa" ON termos_garantia
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_termos_garantia_updated_at 
  BEFORE UPDATE ON termos_garantia 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 