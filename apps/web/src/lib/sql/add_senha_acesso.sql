-- Adicionar campo senha_acesso na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN senha_acesso VARCHAR(4);

-- Criar função para gerar senha de 4 dígitos
CREATE OR REPLACE FUNCTION gerar_senha_acesso()
RETURNS VARCHAR(4) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar senha automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_senha_acesso()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não tem senha, gera uma nova
  IF NEW.senha_acesso IS NULL OR NEW.senha_acesso = '' THEN
    NEW.senha_acesso := gerar_senha_acesso();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela
DROP TRIGGER IF EXISTS trigger_senha_acesso ON ordens_servico;
CREATE TRIGGER trigger_senha_acesso
  BEFORE INSERT OR UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gerar_senha_acesso();

-- Gerar senhas para OS existentes que não têm senha
UPDATE ordens_servico 
SET senha_acesso = gerar_senha_acesso()
WHERE senha_acesso IS NULL OR senha_acesso = '';
