-- =====================================================
-- SISTEMA AGILIZAOS - SQL COMPLETO
-- =====================================================

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  nivel VARCHAR(50) NOT NULL DEFAULT 'atendente',
  permissoes TEXT[] DEFAULT '{}',
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos/serviços
CREATE TABLE IF NOT EXISTS produtos_servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'produto',
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE CATEGORIAS
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

-- =====================================================
-- TABELAS DE CAIXA
-- =====================================================

-- Tabela de turnos de caixa
CREATE TABLE IF NOT EXISTS turnos_caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_abertura DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_fechamento DECIMAL(10,2),
  valor_troco DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentações de caixa
CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID NOT NULL REFERENCES turnos_caixa(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'sangria', 'suprimento', 'venda'
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE VENDAS
-- =====================================================

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES turnos_caixa(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL,
  valor_troco DECIMAL(10,2) DEFAULT 0,
  forma_pagamento VARCHAR(50) DEFAULT 'dinheiro',
  status VARCHAR(20) DEFAULT 'finalizada',
  observacoes TEXT,
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de venda
CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos_servicos(id) ON DELETE SET NULL,
  nome_produto VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE ORDENS DE SERVIÇO
-- =====================================================

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os VARCHAR(50) NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  equipamento VARCHAR(255),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  problema_relatado TEXT,
  problema_diagnosticado TEXT,
  servicos_realizados TEXT,
  pecas_trocadas TEXT,
  valor_total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'aberta',
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_saida TIMESTAMP WITH TIME ZONE,
  prazo_entrega TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE LEMBRETES
-- =====================================================

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_lembrete TIMESTAMP WITH TIME ZONE NOT NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente',
  prioridade VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADICIONAR COLUNAS DE CATEGORIA AOS PRODUTOS
-- =====================================================

ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_produtos(id);
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_produtos(id);
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES subcategorias_produtos(id);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_empresa ON produtos_servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_tipo ON produtos_servicos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_grupo ON produtos_servicos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_categoria ON produtos_servicos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_subcategoria ON produtos_servicos(subcategoria_id);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_grupos_produtos_empresa ON grupos_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_produtos_empresa ON categorias_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_produtos_grupo ON categorias_produtos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_produtos_empresa ON subcategorias_produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_produtos_categoria ON subcategorias_produtos(categoria_id);

-- Índices para caixa
CREATE INDEX IF NOT EXISTS idx_turnos_caixa_usuario ON turnos_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_caixa_empresa ON turnos_caixa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_turnos_caixa_status ON turnos_caixa(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_turno ON movimentacoes_caixa(turno_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa ON movimentacoes_caixa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_tipo ON movimentacoes_caixa(tipo);

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_vendas_turno ON vendas(turno_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON itens_venda(produto_id);

-- Índices para ordens de serviço
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_usuario ON ordens_servico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_empresa ON ordens_servico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_numero ON ordens_servico(numero_os);

-- Índices para lembretes
CREATE INDEX IF NOT EXISTS idx_lembretes_usuario ON lembretes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_empresa ON lembretes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data ON lembretes(data_lembrete);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON lembretes(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para empresas
CREATE POLICY "Usuários podem ver própria empresa" ON empresas
  FOR SELECT USING (
    id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar própria empresa" ON empresas
  FOR UPDATE USING (
    id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para usuários
CREATE POLICY "Usuários podem ver usuários da própria empresa" ON usuarios
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir usuários na própria empresa" ON usuarios
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar usuários da própria empresa" ON usuarios
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar usuários da própria empresa" ON usuarios
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para clientes
CREATE POLICY "Usuários podem ver clientes da própria empresa" ON clientes
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir clientes na própria empresa" ON clientes
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar clientes da própria empresa" ON clientes
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar clientes da própria empresa" ON clientes
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para produtos
CREATE POLICY "Usuários podem ver produtos da própria empresa" ON produtos_servicos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir produtos na própria empresa" ON produtos_servicos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar produtos da própria empresa" ON produtos_servicos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar produtos da própria empresa" ON produtos_servicos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para categorias
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

-- Políticas para caixa
CREATE POLICY "Usuários podem ver turnos da própria empresa" ON turnos_caixa
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir turnos na própria empresa" ON turnos_caixa
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar turnos da própria empresa" ON turnos_caixa
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver movimentações da própria empresa" ON movimentacoes_caixa
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir movimentações na própria empresa" ON movimentacoes_caixa
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar movimentações da própria empresa" ON movimentacoes_caixa
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar movimentações da própria empresa" ON movimentacoes_caixa
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para vendas
CREATE POLICY "Usuários podem ver vendas da própria empresa" ON vendas
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir vendas na própria empresa" ON vendas
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar vendas da própria empresa" ON vendas
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver itens de venda da própria empresa" ON itens_venda
  FOR SELECT USING (
    venda_id IN (
      SELECT id FROM vendas WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem inserir itens de venda na própria empresa" ON itens_venda
  FOR INSERT WITH CHECK (
    venda_id IN (
      SELECT id FROM vendas WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Políticas para ordens de serviço
CREATE POLICY "Usuários podem ver OS da própria empresa" ON ordens_servico
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir OS na própria empresa" ON ordens_servico
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar OS da própria empresa" ON ordens_servico
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar OS da própria empresa" ON ordens_servico
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para lembretes
CREATE POLICY "Usuários podem ver lembretes da própria empresa" ON lembretes
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir lembretes na própria empresa" ON lembretes
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar lembretes da própria empresa" ON lembretes
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar lembretes da própria empresa" ON lembretes
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_servicos_updated_at BEFORE UPDATE ON produtos_servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grupos_produtos_updated_at BEFORE UPDATE ON grupos_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_produtos_updated_at BEFORE UPDATE ON categorias_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategorias_produtos_updated_at BEFORE UPDATE ON subcategorias_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turnos_caixa_updated_at BEFORE UPDATE ON turnos_caixa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimentacoes_caixa_updated_at BEFORE UPDATE ON movimentacoes_caixa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itens_venda_updated_at BEFORE UPDATE ON itens_venda FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lembretes_updated_at BEFORE UPDATE ON lembretes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE empresas IS 'Tabela de empresas do sistema';
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema';
COMMENT ON TABLE clientes IS 'Tabela de clientes das empresas';
COMMENT ON TABLE produtos_servicos IS 'Tabela de produtos e serviços';
COMMENT ON TABLE grupos_produtos IS 'Grupos de categorização de produtos';
COMMENT ON TABLE categorias_produtos IS 'Categorias dentro dos grupos';
COMMENT ON TABLE subcategorias_produtos IS 'Subcategorias dentro das categorias';
COMMENT ON TABLE turnos_caixa IS 'Turnos de abertura e fechamento de caixa';
COMMENT ON TABLE movimentacoes_caixa IS 'Movimentações financeiras do caixa';
COMMENT ON TABLE vendas IS 'Vendas realizadas no sistema';
COMMENT ON TABLE itens_venda IS 'Itens individuais de cada venda';
COMMENT ON TABLE ordens_servico IS 'Ordens de serviço para manutenção';
COMMENT ON TABLE lembretes IS 'Lembretes e tarefas dos usuários';

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 