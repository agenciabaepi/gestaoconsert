-- =====================================================
-- VERIFICAR RESULTADO FINAL
-- =====================================================

-- 1. Contar comissões
SELECT 'TOTAL COMISSOES' as resultado, COUNT(*) as quantidade FROM comissoes_historico;

-- 2. Ver o erro completo
SELECT 
  'ERRO DETALHADO' as tipo,
  mensagem
FROM teste_trigger_log 
WHERE mensagem LIKE '%ERRO%'
ORDER BY timestamp DESC 
LIMIT 2;

-- 3. Ver se a comissão foi criada
SELECT 
  'ULTIMA COMISSAO' as info,
  tecnico_id,
  valor_servico,
  valor_comissao,
  data_entrega
FROM comissoes_historico 
ORDER BY data_entrega DESC 
LIMIT 1;
