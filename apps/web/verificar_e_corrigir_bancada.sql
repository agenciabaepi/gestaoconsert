-- Script para verificar e corrigir problemas na bancada do técnico
-- =====================================================

-- 1. Verificar se a tabela status_fixo existe e tem dados
SELECT 'Verificando tabela status_fixo...' as info;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'status_fixo'
ORDER BY ordinal_position;

-- Verificar se existem status para OS
SELECT 'Status fixos para OS:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

-- Verificar se existe o status "EM ANÁLISE"
SELECT 'Verificando status EM ANÁLISE:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os' AND nome = 'EM ANÁLISE';

-- 2. Verificar permissões RLS na tabela ordens_servico
SELECT 'Verificando RLS na tabela ordens_servico...' as info;

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'ordens_servico';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ordens_servico';

-- 3. Verificar dados de teste
SELECT 'Verificando dados de teste...' as info;

-- Verificar se existem ordens de teste
SELECT COUNT(*) as total_ordens
FROM ordens_servico;

-- Verificar ordens com status ABERTA
SELECT id, numero_os, status, status_tecnico, tecnico_id
FROM ordens_servico
WHERE status = 'ABERTA'
LIMIT 5;

-- 4. Verificar usuários técnicos
SELECT 'Verificando usuários técnicos...' as info;

SELECT u.id, u.nome, u.nivel, u.empresa_id, e.nome as empresa_nome
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.nivel = 'tecnico'
LIMIT 5;

-- 5. Corrigir problemas identificados

-- Se não existir o status "EM ANÁLISE", inserir
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
  gen_random_uuid(),
  'EM ANÁLISE',
  '#3b82f6',
  2,
  'os'
WHERE NOT EXISTS (
  SELECT 1 FROM status_fixo 
  WHERE tipo = 'os' AND nome = 'EM ANÁLISE'
);

-- Se não existir o status "AGUARDANDO INÍCIO", inserir
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
  gen_random_uuid(),
  'AGUARDANDO INÍCIO',
  '#6b7280',
  1,
  'tecnico'
WHERE NOT EXISTS (
  SELECT 1 FROM status_fixo 
  WHERE tipo = 'tecnico' AND nome = 'AGUARDANDO INÍCIO'
);

-- Se não existir o status "EM ANÁLISE" para técnico, inserir
INSERT INTO status_fixo (id, nome, cor, ordem, tipo)
SELECT 
  gen_random_uuid(),
  'EM ANÁLISE',
  '#3b82f6',
  2,
  'tecnico'
WHERE NOT EXISTS (
  SELECT 1 FROM status_fixo 
  WHERE tipo = 'tecnico' AND nome = 'EM ANÁLISE'
);

-- 6. Verificar se as correções funcionaram
SELECT 'Verificando correções...' as info;

SELECT 'Status fixos para OS após correção:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

SELECT 'Status fixos para técnico após correção:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'tecnico'
ORDER BY ordem;

-- 7. Criar dados de teste se necessário
SELECT 'Criando dados de teste se necessário...' as info;

-- Inserir empresa de teste se não existir
INSERT INTO empresas (id, nome, cnpj, email)
SELECT 
  gen_random_uuid(),
  'Empresa Teste Bancada',
  '12.345.678/0001-90',
  'teste@bancada.com'
WHERE NOT EXISTS (
  SELECT 1 FROM empresas WHERE nome = 'Empresa Teste Bancada'
);

-- Inserir técnico de teste se não existir
INSERT INTO usuarios (id, nome, email, nivel, empresa_id)
SELECT 
  gen_random_uuid(),
  'Técnico Teste',
  'tecnico@teste.com',
  'tecnico',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'tecnico@teste.com'
);

-- Inserir cliente de teste se não existir
INSERT INTO clientes (id, nome, cpf_cnpj, telefone, empresa_id)
SELECT 
  gen_random_uuid(),
  'Cliente Teste Bancada',
  '123.456.789-00',
  '(11) 99999-9999',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM clientes WHERE nome = 'Cliente Teste Bancada'
);

-- Inserir ordem de teste se não existir
INSERT INTO ordens_servico (
  id, numero_os, cliente_id, tecnico_id, empresa_id, 
  status, status_tecnico, categoria, marca, modelo, 
  servico, valor_servico, relato
)
SELECT 
  gen_random_uuid(),
  'OS-TESTE-001',
  (SELECT id FROM clientes WHERE nome = 'Cliente Teste Bancada' LIMIT 1),
  (SELECT id FROM usuarios WHERE email = 'tecnico@teste.com' LIMIT 1),
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1),
  'ABERTA',
  'AGUARDANDO INÍCIO',
  'Smartphone',
  'Samsung',
  'Galaxy S21',
  'Troca de tela',
  '150.00',
  'Tela quebrada, precisa de troca'
WHERE NOT EXISTS (
  SELECT 1 FROM ordens_servico WHERE numero_os = 'OS-TESTE-001'
);

-- 8. Verificar dados finais
SELECT 'Dados finais para teste:' as info;

SELECT 
  os.id,
  os.numero_os,
  os.status,
  os.status_tecnico,
  c.nome as cliente,
  u.nome as tecnico,
  e.nome as empresa
FROM ordens_servico os
LEFT JOIN clientes c ON os.cliente_id = c.id
LEFT JOIN usuarios u ON os.tecnico_id = u.id
LEFT JOIN empresas e ON os.empresa_id = e.id
WHERE os.numero_os = 'OS-TESTE-001'
LIMIT 1; 