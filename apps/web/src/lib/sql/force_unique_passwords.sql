-- Script para forçar senhas únicas para todas as OS
-- Remove todas as senhas existentes e gera novas aleatórias

-- Função para gerar string aleatória de 4 dígitos
CREATE OR REPLACE FUNCTION generate_random_4_digit_string()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Limpar todas as senhas existentes
UPDATE ordens_servico
SET senha_acesso = NULL;

-- Gerar senhas únicas para todas as OS
UPDATE ordens_servico
SET senha_acesso = generate_random_4_digit_string();

-- Verificar se há duplicatas e corrigir
DO $$
DECLARE
    rec RECORD;
    new_password TEXT;
BEGIN
    FOR rec IN 
        SELECT id, senha_acesso, 
               ROW_NUMBER() OVER (PARTITION BY senha_acesso ORDER BY id) as rn
        FROM ordens_servico 
        WHERE senha_acesso IS NOT NULL
    LOOP
        IF rec.rn > 1 THEN
            -- Se é duplicata, gera nova senha
            LOOP
                new_password := generate_random_4_digit_string();
                -- Verifica se a nova senha já existe
                IF NOT EXISTS (SELECT 1 FROM ordens_servico WHERE senha_acesso = new_password) THEN
                    UPDATE ordens_servico 
                    SET senha_acesso = new_password 
                    WHERE id = rec.id;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Função trigger para definir senha_acesso em novos registros
CREATE OR REPLACE FUNCTION set_senha_acesso_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    new_password TEXT;
BEGIN
    IF NEW.senha_acesso IS NULL OR NEW.senha_acesso = '' THEN
        -- Gera senha única
        LOOP
            new_password := generate_random_4_digit_string();
            -- Verifica se a senha já existe
            IF NOT EXISTS (SELECT 1 FROM ordens_servico WHERE senha_acesso = new_password) THEN
                NEW.senha_acesso := new_password;
                EXIT;
            END IF;
        END LOOP;
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
