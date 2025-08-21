-- =====================================================
-- DIAGNÓSTICO BÁSICO CORRIGIDO
-- =====================================================

-- 1. Verificar se nossa tabela de teste existe
SELECT 'TABELA TESTE' as info, COUNT(*) as quantidade
FROM teste_trigger_log;

-- 2. Ver se capturou algum log
SELECT 'LOGS' as info, mensagem, timestamp
FROM teste_trigger_log 
ORDER BY timestamp;

-- 3. Verificar triggers com consulta corrigida
SELECT 
  'TRIGGERS' as info,
  trigger_name,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'ordens_servico';

-- 4. Verificar se a OS 921 existe
SELECT 
  'OS 921' as info,
  numero_os,
  status,
  tecnico_id
FROM ordens_servico 
WHERE numero_os = '921';

-- 5. Teste manual simples - inserir log diretamente
INSERT INTO teste_trigger_log (mensagem) 
VALUES ('TESTE DIRETO - ' || NOW()::TEXT);

-- 6. Verificar se inserção funcionou
SELECT 'TESTE DIRETO' as info, mensagem 
FROM teste_trigger_log 
WHERE mensagem LIKE 'TESTE DIRETO%';

-- 7. Tentar um trigger super simples
CREATE OR REPLACE FUNCTION trigger_teste_basico()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO teste_trigger_log (mensagem) 
    VALUES ('TRIGGER FUNCIONA - OS: ' || NEW.numero_os);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Dropar e recriar trigger
DROP TRIGGER IF EXISTS trigger_teste_basico ON ordens_servico;
CREATE TRIGGER trigger_teste_basico
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION trigger_teste_basico();

-- 9. Fazer update na OS para disparar
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = '921';

-- 10. Verificar se o trigger disparou
SELECT 'RESULTADO TRIGGER' as info, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%TRIGGER FUNCIONA%'
ORDER BY timestamp DESC;
