-- =====================================================
-- TABELAS DE CATEGORIAS - SQL SIMPLES
-- =====================================================

-- Tabela para grupos de produtos
CREATE TABLE IF NOT EXISTS grupos_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para categorias de produtos
CREATE TABLE IF NOT EXISTS categorias_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  grupo_id UUID NOT NULL REFERENCES grupos_produtos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para subcategorias de produtos
CREATE TABLE IF NOT EXISTS subcategorias_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria_id UUID NOT NULL REFERENCES categorias_produtos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas de categoria aos produtos existentes
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_produtos(id);
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_produtos(id);
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES subcategorias_produtos(id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_grupos_produtos_empresa ON grupos_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_produtos_empresa ON categorias_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_produtos_grupo ON categorias_produtos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_produtos_empresa ON subcategorias_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_produtos_categoria ON subcategorias_produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_grupo ON produtos_servicos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_categoria ON produtos_servicos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_subcategoria ON produtos_servicos(subcategoria_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE grupos_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias_produtos ENABLE ROW LEVEL SECURITY;

-- Políticas para grupos_produtos
CREATE POLICY "Usuários podem ver grupos da própria empresa" ON grupos_produtos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir grupos na própria empresa" ON grupos_produtos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar grupos da própria empresa" ON grupos_produtos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar grupos da própria empresa" ON grupos_produtos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para categorias_produtos
CREATE POLICY "Usuários podem ver categorias da própria empresa" ON categorias_produtos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir categorias na própria empresa" ON categorias_produtos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar categorias da própria empresa" ON categorias_produtos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar categorias da própria empresa" ON categorias_produtos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para subcategorias_produtos
CREATE POLICY "Usuários podem ver subcategorias da própria empresa" ON subcategorias_produtos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir subcategorias na própria empresa" ON subcategorias_produtos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar subcategorias da própria empresa" ON subcategorias_produtos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar subcategorias da própria empresa" ON subcategorias_produtos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  ); 