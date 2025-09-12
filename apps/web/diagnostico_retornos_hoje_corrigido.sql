-- Diagnóstico completo para verificar por que Retornos do Dia mostra 0
-- VERSÃO CORRIGIDA com nomes corretos das colunas

-- 1. Verificar se existem OS criadas hoje
SELECT 
  'OS criadas hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE;

-- 2. Verificar OS do tipo 'Retorno' criadas hoje
SELECT 
  'OS tipo Retorno hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND tipo = 'Retorno';

-- 3. Verificar OS com os_garantia_id preenchido criadas hoje
SELECT 
  'OS com garantia hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND os_garantia_id IS NOT NULL;

-- 4. Verificar total de retornos (lógica do dashboard)
SELECT 
  'Total retornos hoje (lógica dashboard)' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL);

-- 5. Se não houver dados, criar uma OS de teste para hoje
INSERT INTO ordens_servico (
  numero_os,
  cliente_id,
  usuario_id,  -- Campo correto
  empresa_id,
  categoria,
  marca,
  modelo,
  servico,
  status,
  tipo,
  valor_servico,
  created_at
) 
SELECT 
  'OS-RETORNO-TESTE-' || EXTRACT(EPOCH FROM NOW())::text,
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  'Smartphone',
  'Apple',
  'iPhone 14',
  'Retorno - Teste para dashboard',
  'Pendente',
  'Retorno',
  0.00,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM ordens_servico 
  WHERE DATE(created_at) = CURRENT_DATE 
    AND tipo = 'Retorno'
);

-- 6. Verificar novamente após inserção
SELECT 
  'Verificação final' as tipo,
  COUNT(*) as retornos_hoje
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL);

-- 7. Mostrar detalhes das OS de retorno criadas hoje
SELECT 
  numero_os,
  tipo,
  os_garantia_id,
  CASE 
    WHEN tipo = 'Retorno' THEN 'Retorno por Tipo'
    WHEN os_garantia_id IS NOT NULL THEN 'Retorno por Garantia'
    ELSE 'OS Normal'
  END as classificacao,
  created_at
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL)
ORDER BY created_at DESC;