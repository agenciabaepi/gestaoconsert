-- Script para quando a coluna senha_acesso já existe
-- Apenas atualiza registros existentes e cria o trigger

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
WHERE senha_acesso IS NULL OR senha_acesso = '';

-- Função trigger para definir senha_acesso em novos registros
CREATE OR REPLACE FUNCTION set_senha_acesso_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.senha_acesso IS NULL OR NEW.senha_acesso = '' THEN
        NEW.senha_acesso = generate_random_4_digit_string();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trg_set_senha_acesso_on_insert ON ordens_servico;

-- Criar o trigger
CREATE TRIGGER trg_set_senha_acesso_on_insert
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION set_senha_acesso_on_insert();
