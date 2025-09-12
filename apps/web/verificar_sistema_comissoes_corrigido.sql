-- =====================================================
-- VERIFICAR SE O SISTEMA DE COMISSÕES ESTÁ FUNCIONANDO
-- (VERSÃO CORRIGIDA)
-- =====================================================

-- 1. Verificar estrutura criada
SELECT 
  'ESTRUTURA' as categoria,
  'Colunas de comissão criadas' as item,
  COUNT(*)::TEXT as resultado
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('comissao_percentual', 'comissao_ativa', 'comissao_observacoes')

UNION ALL

SELECT 
  'ESTRUTURA' as categoria,
  'Tabelas criadas' as item,
  COUNT(*)::TEXT as resultado
FROM information_schema.tables 
WHERE table_name IN ('configuracoes_comissao', 'comissoes_historico')

UNION ALL

SELECT 
  'ESTRUTURA' as categoria,
  'Trigger criado' as item,
  COUNT(*)::TEXT as resultado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar dados configurados
SELECT 
  'DADOS' as categoria,
  'Técnicos com comissão ativa' as item,
  COUNT(*)::TEXT as resultado
FROM usuarios 
WHERE nivel = 'tecnico' AND comissao_ativa = true

UNION ALL

SELECT 
  'DADOS' as categoria,
  'Empresas configuradas' as item,
  COUNT(*)::TEXT as resultado
FROM configuracoes_comissao

UNION ALL

SELECT 
  'DADOS' as categoria,
  'OSs entregues disponíveis' as item,
  COUNT(*)::TEXT as resultado
FROM ordens_servico 
WHERE status = 'ENTREGUE' AND tecnico_id IS NOT NULL

UNION ALL

SELECT 
  'DADOS' as categoria,
  'Comissões já calculadas' as item,
  COUNT(*)::TEXT as resultado
FROM comissoes_historico;

-- 3. Mostrar técnicos e suas configurações
SELECT 
  'TÉCNICO' as tipo,
  u.nome,
  u.email,
  COALESCE(u.comissao_percentual::TEXT, '0') || '%' as percentual,
  CASE WHEN u.comissao_ativa THEN 'SIM' ELSE 'NÃO' END as ativo
FROM usuarios u
WHERE u.nivel = 'tecnico'
ORDER BY u.nome;

-- 4. Mostrar OSs que podem gerar comissão
SELECT 
  'OS_DISPONIVEL' as tipo,
  COALESCE(os.numero_os::TEXT, os.id::TEXT) as numero_os,
  COALESCE(u.nome, 'SEM TÉCNICO') as tecnico,
  'R$ ' || COALESCE(os.valor_servico::TEXT, '0') as valor_servico,
  os.status
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status IN ('CONCLUIDO', 'FINALIZADO', 'ENTREGUE')
  AND (os.tecnico_id IS NULL OR u.nivel = 'tecnico')
ORDER BY os.created_at DESC
LIMIT 5;

-- 5. Mostrar comissões já calculadas
SELECT 
  'COMISSAO_CALCULADA' as tipo,
  u.nome as tecnico,
  COALESCE(os.numero_os::TEXT, os.id::TEXT) as numero_os,
  'R$ ' || ch.valor_comissao::TEXT as valor_comissao,
  ch.data_entrega::DATE::TEXT as data_entrega
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
ORDER BY ch.data_entrega DESC
LIMIT 5;

-- 6. Resumo final
SELECT 
  'RESUMO' as categoria,
  'Sistema instalado' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM usuarios WHERE comissao_ativa = true) 
    THEN 'OK - Técnicos com comissão'
    ELSE 'ATENÇÃO - Nenhum técnico ativo'
  END as resultado

UNION ALL

SELECT 
  'RESUMO' as categoria,
  'Trigger funcionando' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_calcular_comissao')
    THEN 'OK - Trigger criado'
    ELSE 'ERRO - Trigger não encontrado'
  END as resultado

UNION ALL

SELECT 
  'RESUMO' as categoria,
  'Comissões calculadas' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM comissoes_historico)
    THEN 'OK - ' || (SELECT COUNT(*)::TEXT FROM comissoes_historico) || ' comissões'
    ELSE 'AGUARDANDO - Nenhuma comissão ainda'
  END as resultado;
