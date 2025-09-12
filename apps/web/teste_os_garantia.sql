-- Script para testar OS com os_garantia_id preenchido
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, verificar se existe algum termo de garantia
SELECT id, nome FROM termos_garantia LIMIT 1;

-- 2. Se não existir, criar um termo de garantia de teste
INSERT INTO termos_garantia (
  id,
  empresa_id,
  nome,
  conteudo,
  ativo,
  ordem
) 
SELECT 
  gen_random_uuid(),
  (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  'Garantia Teste 90 Dias',
  '<p>Termo de garantia para teste</p>',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM termos_garantia LIMIT 1);

-- 3. Criar OS de teste com os_garantia_id preenchido (retorno de garantia)
INSERT INTO ordens_servico (
  numero_os,
  cliente_id,
  usuario_id,
  empresa_id,
  categoria,
  marca,
  modelo,
  servico,
  status,
  tipo,
  valor_servico,
  os_garantia_id,
  created_at
) 
SELECT 
  'OS-GARANTIA-001',
  (SELECT id FROM clientes WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1) LIMIT 1),
  (SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  'Smartphone',
  'Samsung',
  'Galaxy S22',
  'Retorno - Problema na tela',
  'Em análise',
  'Normal',  -- Tipo Normal, mas com os_garantia_id preenchido
  0.00,
  (SELECT id FROM termos_garantia LIMIT 1),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ordens_servico WHERE numero_os = 'OS-GARANTIA-001');

-- 4. Criar mais uma OS de retorno tradicional (tipo = 'Retorno')
INSERT INTO ordens_servico (
  numero_os,
  cliente_id,
  usuario_id,
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
  'OS-RETORNO-001',
  (SELECT id FROM clientes WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1) LIMIT 1),
  (SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  'Notebook',
  'Dell',
  'Inspiron 15',
  'Retorno - Problema no carregamento',
  'Pendente',
  'Retorno',  -- Tipo Retorno tradicional
  0.00,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ordens_servico WHERE numero_os = 'OS-RETORNO-001');

-- 5. Verificar os dados criados
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
WHERE numero_os IN ('OS-GARANTIA-001', 'OS-RETORNO-001')
ORDER BY created_at DESC;

-- 6. Testar a lógica do dashboard
SELECT 
  'TESTE LÓGICA DASHBOARD' as info,
  COUNT(*) as total_retornos_hoje
FROM ordens_servico 
WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
  AND DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL);