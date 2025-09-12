-- =====================================================
-- VER LOGS AGORA
-- =====================================================

-- Ver todos os logs da tabela de teste
SELECT 
  ROW_NUMBER() OVER (ORDER BY timestamp) as ordem,
  mensagem,
  timestamp
FROM teste_trigger_log 
ORDER BY timestamp DESC;
