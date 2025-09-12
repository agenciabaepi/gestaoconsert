-- =====================================================
-- SISTEMA DE CONTROLE DE ACESSO E PAGAMENTOS
-- =====================================================

-- =====================================================
-- TABELA DE PLANOS
-- =====================================================

CREATE TABLE IF NOT EXISTS planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    periodo VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    limite_usuarios INT DEFAULT 1,
    limite_produtos INT DEFAULT 100,
    limite_clientes INT DEFAULT 100,
    limite_fornecedores INT DEFAULT 50,
    recursos_disponiveis JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ASSINATURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plano_id UUID NOT NULL REFERENCES planos(id),
    status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, cancelled, expired, suspended
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    data_trial_fim TIMESTAMP WITH TIME ZONE,
    proxima_cobranca TIMESTAMP WITH TIME ZONE,
    valor DECIMAL(10,2) NOT NULL,
    gateway_pagamento VARCHAR(100), -- stripe, paypal, etc
    id_externo VARCHAR(255), -- ID da assinatura no gateway
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE COBRANÇAS
-- =====================================================

CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assinatura_id UUID NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    data_cobranca TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    gateway_id VARCHAR(255), -- ID da cobrança no gateway
    gateway_status VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_planos_ativo ON planos(ativo);
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_data_fim ON assinaturas(data_fim);
CREATE INDEX IF NOT EXISTS idx_cobrancas_assinatura_id ON cobrancas(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Planos (público para leitura)
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos visíveis para todos" ON planos FOR SELECT USING (true);

-- Assinaturas (apenas empresa pode ver suas assinaturas)
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresa pode ver suas assinaturas" ON assinaturas
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Empresa pode criar assinaturas" ON assinaturas
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Empresa pode atualizar suas assinaturas" ON assinaturas
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Cobranças (apenas empresa pode ver suas cobranças)
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresa pode ver suas cobranças" ON cobrancas
    FOR SELECT USING (assinatura_id IN (
        SELECT id FROM assinaturas WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir planos padrão
INSERT INTO planos (nome, descricao, preco, limite_usuarios, limite_produtos, limite_clientes, limite_fornecedores, recursos_disponiveis) VALUES
('Trial', 'Período de teste gratuito', 0.00, 1, 50, 20, 10, '{"relatorios": false, "api": false, "suporte": false}'),
('Básico', 'Plano básico para pequenas empresas', 29.90, 3, 500, 200, 50, '{"relatorios": true, "api": false, "suporte": false}'),
('Profissional', 'Plano completo para empresas em crescimento', 79.90, 10, 2000, 1000, 200, '{"relatorios": true, "api": true, "suporte": true}'),
('Empresarial', 'Plano para grandes empresas', 199.90, 50, 10000, 5000, 1000, '{"relatorios": true, "api": true, "suporte": true, "whitelabel": true}');

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para verificar se empresa tem assinatura ativa
CREATE OR REPLACE FUNCTION empresa_tem_assinatura_ativa(empresa_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    assinatura_ativa BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM assinaturas 
        WHERE empresa_id = empresa_uuid 
        AND status IN ('active', 'trial')
        AND (data_fim IS NULL OR data_fim > NOW())
    ) INTO assinatura_ativa;
    
    RETURN assinatura_ativa;
END;
$$ LANGUAGE plpgsql;

-- Função para obter plano atual da empresa
CREATE OR REPLACE FUNCTION obter_plano_empresa(empresa_uuid UUID)
RETURNS TABLE (
    plano_id UUID,
    plano_nome VARCHAR(100),
    status VARCHAR(50),
    data_fim TIMESTAMP WITH TIME ZONE,
    limite_usuarios INT,
    limite_produtos INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        a.status,
        a.data_fim,
        p.limite_usuarios,
        p.limite_produtos
    FROM assinaturas a
    JOIN planos p ON a.plano_id = p.id
    WHERE a.empresa_id = empresa_uuid
    AND a.status IN ('active', 'trial')
    AND (a.data_fim IS NULL OR a.data_fim > NOW())
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE planos IS 'Tabela de planos disponíveis para assinatura';
COMMENT ON TABLE assinaturas IS 'Tabela de assinaturas das empresas';
COMMENT ON TABLE cobrancas IS 'Tabela de cobranças das assinaturas';
COMMENT ON FUNCTION empresa_tem_assinatura_ativa(UUID) IS 'Verifica se uma empresa tem assinatura ativa';
COMMENT ON FUNCTION obter_plano_empresa(UUID) IS 'Retorna o plano atual de uma empresa'; 