-- Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE ordens_servico DISABLE ROW LEVEL SECURITY;

-- Ou criar política permissiva para inserção
CREATE POLICY "Permitir inserção de ordens de serviço" ON ordens_servico
FOR INSERT WITH CHECK (true);

-- Política para SELECT (usuários podem ver ordens da sua empresa)
CREATE POLICY "Usuários podem ver ordens da sua empresa" ON ordens_servico
FOR SELECT USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Política para UPDATE (usuários podem atualizar ordens da sua empresa)
CREATE POLICY "Usuários podem atualizar ordens da sua empresa" ON ordens_servico
FOR UPDATE USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Política para DELETE (usuários podem deletar ordens da sua empresa)
CREATE POLICY "Usuários podem deletar ordens da sua empresa" ON ordens_servico
FOR DELETE USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Habilitar RLS novamente
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY; 