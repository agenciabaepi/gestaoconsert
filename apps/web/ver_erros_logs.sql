-- =====================================================
-- VER ERROS NOS LOGS
-- =====================================================

-- Ver erros específicos
SELECT 
  'ERRO' as tipo,
  mensagem,
  timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%ERRO%' 
   OR mensagem LIKE '%TESTE BASICO%'
ORDER BY timestamp DESC 
LIMIT 10;
