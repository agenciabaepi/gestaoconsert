-- =====================================================
-- VERIFICAÇÃO SIMPLES DO SISTEMA DE COMISSÕES
-- =====================================================

-- 1. Verificar estrutura (tabelas e colunas)
SELECT 'ESTRUTURA BÁSICA' as verificacao;

SELECT 
  'usuarios - comissao_percentual' as item,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FALTANDO' END as status
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'comissao_percentual';

SELECT 
  'usuarios - comissao_ativa' as item,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FALTANDO' END as status
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'comissao_ativa';

SELECT 
  'tabela configuracoes_comissao' as item,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FALTANDO' END as status
FROM information_schema.tables 
WHERE table_name = 'configuracoes_comissao';

SELECT 
  'tabela comissoes_historico' as item,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FALTANDO' END as status
FROM information_schema.tables 
WHERE table_name = 'comissoes_historico';

SELECT 
  'trigger calcular_comissao' as item,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FALTANDO' END as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 2. Verificar dados
SELECT 'DADOS CONFIGURADOS' as verificacao;

SELECT 
  'Técnicos cadastrados' as item,
  COUNT(*)::TEXT as quantidade
FROM usuarios WHERE nivel = 'tecnico';

SELECT 
  'Técnicos com comissão ativa' as item,
  COUNT(*)::TEXT as quantidade
FROM usuarios WHERE nivel = 'tecnico' AND comissao_ativa = true;

SELECT 
  'Empresas configuradas' as item,
  COUNT(*)::TEXT as quantidade
FROM configuracoes_comissao;

SELECT 
  'OSs com status ENTREGUE' as item,
  COUNT(*)::TEXT as quantidade
FROM ordens_servico WHERE status = 'ENTREGUE';

SELECT 
  'Comissões calculadas' as item,
  COUNT(*)::TEXT as quantidade
FROM comissoes_historico;

-- 3. Mostrar técnicos
SELECT 'TÉCNICOS CONFIGURADOS' as verificacao;

SELECT 
  nome,
  email,
  comissao_percentual::TEXT || '%' as percentual,
  CASE WHEN comissao_ativa THEN 'ATIVO' ELSE 'INATIVO' END as status
FROM usuarios 
WHERE nivel = 'tecnico'
ORDER BY nome;

-- 4. Mostrar algumas OSs
SELECT 'ORDENS DE SERVIÇO' as verificacao;

SELECT 
  id::TEXT as os_id,
  numero_os::TEXT as numero,
  status,
  valor_servico::TEXT as valor_servico,
  CASE WHEN tecnico_id IS NOT NULL THEN 'TEM TÉCNICO' ELSE 'SEM TÉCNICO' END as tecnico_status
FROM ordens_servico 
WHERE status IN ('CONCLUIDO', 'FINALIZADO', 'ENTREGUE')
ORDER BY created_at DESC
LIMIT 5;

-- 5. Mostrar comissões (se houver)
SELECT 'COMISSÕES CALCULADAS' as verificacao;

SELECT 
  ch.id::TEXT as comissao_id,
  ch.valor_comissao::TEXT as valor,
  ch.percentual_comissao::TEXT || '%' as percentual,
  ch.status,
  ch.data_entrega::TEXT as data
FROM comissoes_historico ch
ORDER BY ch.created_at DESC
LIMIT 5;

-- 6. Teste rápido para calcular comissão
SELECT 'TESTE DE CÁLCULO' as verificacao;

SELECT 
  'Para testar, execute:' as instrucao,
  'UPDATE ordens_servico SET status = ''ENTREGUE'', valor_servico = 100 WHERE id = ''sua_os_id'';' as comando;
