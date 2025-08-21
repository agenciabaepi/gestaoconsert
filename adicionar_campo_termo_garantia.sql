-- Adicionar campo termo_garantia_id na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS termo_garantia_id UUID REFERENCES termos_garantia(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_termo_garantia_id 
ON ordens_servico(termo_garantia_id);

-- Comentário para documentar o campo
COMMENT ON COLUMN ordens_servico.termo_garantia_id IS 'Referência ao termo de garantia selecionado para esta OS'; 