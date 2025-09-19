-- =====================================================
-- AJUSTES PARA TABELA FORNECEDORES EXISTENTE
-- =====================================================

-- Adicionar colunas que estão faltando na tabela atual
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Renomear coluna cnpj_cpf para cnpj para manter compatibilidade
ALTER TABLE fornecedores RENAME COLUMN cnpj_cpf TO cnpj;

-- Renomear colunas de timestamp para manter padrão
ALTER TABLE fornecedores RENAME COLUMN criado_em TO created_at;
ALTER TABLE fornecedores RENAME COLUMN atualizado_em TO updated_at;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id ON fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON fornecedores(ativo);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ver fornecedores da sua empresa
CREATE POLICY "Usuários podem ver fornecedores da sua empresa" ON fornecedores
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Política para INSERT - usuários podem criar fornecedores na sua empresa
CREATE POLICY "Usuários podem criar fornecedores na sua empresa" ON fornecedores
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Política para UPDATE - usuários podem editar fornecedores da sua empresa
CREATE POLICY "Usuários podem editar fornecedores da sua empresa" ON fornecedores
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Política para DELETE - usuários podem deletar fornecedores da sua empresa
CREATE POLICY "Usuários podem deletar fornecedores da sua empresa" ON fornecedores
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- =====================================================
-- ADICIONAR COLUNA FORNECEDOR_ID NA TABELA PRODUTOS_SERVICOS
-- =====================================================

-- Adicionar coluna fornecedor_id na tabela produtos_servicos
ALTER TABLE produtos_servicos ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id);

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_produtos_servicos_fornecedor_id ON produtos_servicos(fornecedor_id);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE fornecedores IS 'Tabela para armazenar informações dos fornecedores';
COMMENT ON COLUMN fornecedores.nome IS 'Nome do fornecedor';
COMMENT ON COLUMN fornecedores.cnpj IS 'CNPJ do fornecedor';
COMMENT ON COLUMN fornecedores.telefone IS 'Telefone de contato';
COMMENT ON COLUMN fornecedores.celular IS 'Celular de contato';
COMMENT ON COLUMN fornecedores.email IS 'Email de contato';
COMMENT ON COLUMN fornecedores.endereco IS 'Endereço completo';
COMMENT ON COLUMN fornecedores.cidade IS 'Cidade';
COMMENT ON COLUMN fornecedores.estado IS 'Estado (UF)';
COMMENT ON COLUMN fornecedores.cep IS 'CEP';
COMMENT ON COLUMN fornecedores.observacoes IS 'Observações adicionais';
COMMENT ON COLUMN fornecedores.ativo IS 'Indica se o fornecedor está ativo';
COMMENT ON COLUMN produtos_servicos.fornecedor_id IS 'Referência ao fornecedor do produto/serviço'; 