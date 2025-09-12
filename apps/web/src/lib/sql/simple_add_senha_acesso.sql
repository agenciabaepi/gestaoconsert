-- Script simples para adicionar coluna senha_acesso
ALTER TABLE ordens_servico
ADD COLUMN senha_acesso TEXT;

-- Atualizar registros existentes com senha padrão
UPDATE ordens_servico
SET senha_acesso = '1234'
WHERE senha_acesso IS NULL;
