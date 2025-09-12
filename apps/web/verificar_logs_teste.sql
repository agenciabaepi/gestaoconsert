-- =====================================================
-- VERIFICAR LOGS DA TABELA DE TESTE
-- =====================================================

-- 1. Ver todos os logs capturados
SELECT 
  'LOGS CAPTURADOS' as info,
  mensagem,
  timestamp
FROM teste_trigger_log 
ORDER BY timestamp;

-- 2. Contar quantos logs temos
SELECT 'TOTAL LOGS' as info, COUNT(*) as quantidade
FROM teste_trigger_log;

-- 3. Verificar se a tabela existe
SELECT 'TABELA EXISTE' as info, COUNT(*) as existe
FROM information_schema.tables 
WHERE table_name = 'teste_trigger_log';

-- 4. Verificar se nossos triggers existem
SELECT 
  'TRIGGERS ATIVOS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE table_name = 'ordens_servico'
ORDER BY trigger_name;

-- 5. Verificar dados da OS 921
SELECT 
  'OS 921 STATUS' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id,
  cliente_id
FROM ordens_servico 
WHERE numero_os = '921';

-- 6. Se não há logs, vamos testar inserção direta na tabela
INSERT INTO teste_trigger_log (mensagem) 
VALUES ('TESTE MANUAL - Inserção direta funcionando');

-- 7. Verificar se a inserção manual funcionou
SELECT 'TESTE MANUAL' as info, mensagem, timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%TESTE MANUAL%';

-- 8. Tentar um update muito simples para ver se dispara
DO $$
BEGIN
    -- Update mínimo
    UPDATE ordens_servico 
    SET status = status -- não muda nada, só dispara o trigger
    WHERE numero_os = '921';
END $$;

-- 9. Verificar logs após update mínimo
SELECT 'APOS UPDATE MINIMO' as info, mensagem, timestamp
FROM teste_trigger_log 
ORDER BY timestamp DESC;

-- 10. Verificar qual usuário está executando
SELECT 
  'USUARIO ATUAL' as info,
  current_user,
  session_user;
