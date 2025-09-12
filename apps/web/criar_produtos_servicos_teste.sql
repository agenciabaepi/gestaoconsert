-- Script para criar produtos e serviços de teste para a bancada

-- 1. Verificar empresa de teste
SELECT id, nome FROM empresas WHERE nome LIKE '%Teste%' LIMIT 1;

-- 2. Inserir produtos de teste
INSERT INTO produtos_servicos (id, nome, descricao, preco, tipo, empresa_id, codigo, ativo)
SELECT 
  gen_random_uuid(),
  'Tela LCD Samsung Galaxy S21',
  'Tela de reposição para Samsung Galaxy S21',
  450.00,
  'produto',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1),
  'P001',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM produtos_servicos WHERE codigo = 'P001'
);

INSERT INTO produtos_servicos (id, nome, descricao, preco, tipo, empresa_id, codigo, ativo)
SELECT 
  gen_random_uuid(),
  'Bateria iPhone 12',
  'Bateria de reposição para iPhone 12',
  180.00,
  'produto',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1),
  'P002',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM produtos_servicos WHERE codigo = 'P002'
);

-- 3. Inserir serviços de teste
INSERT INTO produtos_servicos (id, nome, descricao, preco, tipo, empresa_id, codigo, ativo)
SELECT 
  gen_random_uuid(),
  'Troca de Tela',
  'Serviço de troca de tela de smartphone',
  80.00,
  'servico',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1),
  'S001',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM produtos_servicos WHERE codigo = 'S001'
);

INSERT INTO produtos_servicos (id, nome, descricao, preco, tipo, empresa_id, codigo, ativo)
SELECT 
  gen_random_uuid(),
  'Formatação de Computador',
  'Formatação e instalação de sistema operacional',
  120.00,
  'servico',
  (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1),
  'S002',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM produtos_servicos WHERE codigo = 'S002'
);

-- 4. Verificar dados inseridos
SELECT 'Produtos e serviços criados:' as info;
SELECT nome, preco, tipo, codigo, ativo
FROM produtos_servicos 
WHERE empresa_id = (SELECT id FROM empresas WHERE nome = 'Empresa Teste Bancada' LIMIT 1)
ORDER BY tipo, nome; 