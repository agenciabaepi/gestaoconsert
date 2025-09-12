-- Adicionar campo imagens na tabela ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS imagens TEXT;
