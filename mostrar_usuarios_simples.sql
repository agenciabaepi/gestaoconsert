-- =====================================================
-- MOSTRAR USUÁRIOS SIMPLES - SEM UPDATES
-- =====================================================

-- 1. Ver TODOS os usuários que existem
SELECT 
  'TODOS OS USUÁRIOS' as info,
  id,
  nome,
  nivel,
  email,
  auth_user_id,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
ORDER BY nome;

-- 2. Contar total de usuários
SELECT 
  'TOTAL USUÁRIOS' as info,
  COUNT(*) as total
FROM usuarios;

-- 3. Ver técnicos especificamente
SELECT 
  'TÉCNICOS' as info,
  id,
  nome,
  comissao_ativa
FROM usuarios 
WHERE nivel = 'tecnico';

-- 4. Ver OSs e seus tecnico_ids atuais
SELECT 
  'OSs E SEUS TÉCNICOS' as info,
  os.id as os_id,
  os.numero_os,
  os.tecnico_id,
  os.status,
  os.valor_servico,
  u.nome as tecnico_nome
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
LIMIT 5;

-- 5. Ver quantas OSs têm tecnico_id inválido
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  COUNT(*) as quantidade
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios);

-- 6. Ver quais tecnico_ids inválidos existem
SELECT DISTINCT
  'IDs INVÁLIDOS ESPECÍFICOS' as problema,
  tecnico_id
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios)
LIMIT 5;

-- 7. Ver se trigger e função existem
SELECT 
  'TRIGGER EXISTS' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_calcular_comissao'
    ) THEN 'SIM' 
    ELSE 'NÃO' 
  END as existe;

SELECT 
  'FUNÇÃO EXISTS' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'calcular_comissao_entrega'
    ) THEN 'SIM' 
    ELSE 'NÃO' 
  END as existe;

-- 8. Ver comissões já existentes
SELECT 
  'COMISSÕES EXISTENTES' as info,
  COUNT(*) as total
FROM comissoes_historico;
