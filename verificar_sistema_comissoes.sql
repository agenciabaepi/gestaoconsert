-- =====================================================
-- VERIFICAR SE O SISTEMA DE COMISSÕES ESTÁ FUNCIONANDO
-- =====================================================

-- 1. Verificar estrutura criada
SELECT 
  'ESTRUTURA' as categoria,
  'Colunas de comissão criadas' as item,
  COUNT(*) as resultado
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('comissao_percentual', 'comissao_ativa', 'comissao_observacoes')

UNION ALL

SELECT 
  'ESTRUTURA' as categoria,
  'Tabelas criadas' as item,
  COUNT(*) as resultado
FROM information_schema.tables 
WHERE table_name IN ('configuracoes_comissao', 'comissoes_historico')

UNION ALL

SELECT 
  'ESTRUTURA' as categoria,
  'Trigger criado' as item,
  COUNT(*) as resultado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar dados configurados
SELECT 
  'DADOS' as categoria,
  'Técnicos com comissão ativa' as item,
  COUNT(*) as resultado
FROM usuarios 
WHERE nivel = 'tecnico' AND comissao_ativa = true

UNION ALL

SELECT 
  'DADOS' as categoria,
  'Empresas configuradas' as item,
  COUNT(*) as resultado
FROM configuracoes_comissao

UNION ALL

SELECT 
  'DADOS' as categoria,
  'OSs entregues disponíveis' as item,
  COUNT(*) as resultado
FROM ordens_servico 
WHERE status = 'ENTREGUE' AND tecnico_id IS NOT NULL

UNION ALL

SELECT 
  'DADOS' as categoria,
  'Comissões já calculadas' as item,
  COUNT(*) as resultado
FROM comissoes_historico;

-- 3. Mostrar técnicos e suas configurações
SELECT 
  '--- TÉCNICOS CONFIGURADOS ---' as info,
  '' as nome,
  '' as email,
  '' as percentual,
  '' as ativo

UNION ALL

SELECT 
  'TÉCNICO' as info,
  u.nome,
  u.email,
  COALESCE(u.comissao_percentual::TEXT, '0') || '%' as percentual,
  CASE WHEN u.comissao_ativa THEN 'SIM' ELSE 'NÃO' END as ativo
FROM usuarios u
WHERE u.nivel = 'tecnico'
ORDER BY info, nome;

-- 4. Mostrar OSs que podem gerar comissão
SELECT 
  '--- OSs QUE PODEM GERAR COMISSÃO ---' as info,
  '' as numero_os,
  '' as tecnico,
  '' as valor_servico,
  '' as status

UNION ALL

SELECT 
  'OS' as info,
  COALESCE(os.numero_os, os.id::TEXT) as numero_os,
  COALESCE(u.nome, 'SEM TÉCNICO') as tecnico,
  'R$ ' || COALESCE(os.valor_servico, '0') as valor_servico,
  os.status
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status IN ('CONCLUIDO', 'FINALIZADO', 'ENTREGUE')
  AND (os.tecnico_id IS NULL OR u.nivel = 'tecnico')
ORDER BY info, numero_os
LIMIT 10;

-- 5. Mostrar comissões já calculadas
SELECT 
  '--- COMISSÕES CALCULADAS ---' as info,
  '' as tecnico,
  '' as numero_os,
  '' as valor_comissao,
  '' as data_entrega

UNION ALL

SELECT 
  'COMISSÃO' as info,
  u.nome as tecnico,
  COALESCE(os.numero_os, os.id::TEXT) as numero_os,
  'R$ ' || ch.valor_comissao::TEXT as valor_comissao,
  ch.data_entrega::DATE::TEXT as data_entrega
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
ORDER BY info, data_entrega DESC;

-- 6. TESTE: Como forçar cálculo de comissão
SELECT 
  '=== COMO TESTAR O SISTEMA ===' as instrucoes

UNION ALL

SELECT 
  '1. Certifique-se que tem técnico com comissao_ativa = true'

UNION ALL

SELECT 
  '2. Atualize uma OS para status = ''ENTREGUE'' com UPDATE:'

UNION ALL

SELECT 
  '   UPDATE ordens_servico SET status = ''ENTREGUE'' WHERE id = ''sua_os_id'';'

UNION ALL

SELECT 
  '3. Verifique se comissão foi criada em comissoes_historico'

UNION ALL

SELECT 
  '4. Dashboard do técnico mostrará os valores automaticamente';
