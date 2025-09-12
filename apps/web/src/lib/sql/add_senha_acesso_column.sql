-- Adicionar coluna senha_acesso na tabela ordens_servico
ALTER TABLE ordens_servico
ADD COLUMN senha_acesso TEXT;

-- Função para gerar string aleatória de 4 dígitos
CREATE OR REPLACE FUNCTION generate_random_4_digit_string()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Atualizar registros existentes com string aleatória de 4 dígitos
UPDATE ordens_servico
SET senha_acesso = generate_random_4_digit_string()
WHERE senha_acesso IS NULL;

-- Função trigger para definir senha_acesso em novos registros
CREATE OR REPLACE FUNCTION set_senha_acesso_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.senha_acesso IS NULL THEN
        NEW.senha_acesso = generate_random_4_digit_string();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
CREATE TRIGGER trg_set_senha_acesso_on_insert
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION set_senha_acesso_on_insert();
