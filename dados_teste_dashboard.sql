-- =====================================================
-- DADOS DE TESTE PARA O DASHBOARD
-- =====================================================

-- Empresa de teste (se não existir)
INSERT INTO empresas (id, nome, cnpj, email, telefone, endereco) 
VALUES (
  '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
  'Tecnologia Consert LTDA',
  '12.345.678/0001-90',
  'contato@consert.com.br',
  '(11) 99999-9999',
  'Rua das Tecnologias, 123 - São Paulo/SP'
) ON CONFLICT (id) DO NOTHING;

-- Produtos e Serviços de teste
INSERT INTO produtos_servicos (empresa_id, nome, descricao, preco, tipo) VALUES
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Troca de Tela', 'Substituição de tela de smartphone', 150.00, 'servico'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Bateria Original', 'Bateria original para iPhone', 89.90, 'produto'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Limpeza de Sistema', 'Limpeza e otimização de sistema', 45.00, 'servico'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Cabo USB-C', 'Cabo de carregamento original', 29.90, 'produto'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Desbloqueio', 'Desbloqueio de senha', 80.00, 'servico'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Capa Protetora', 'Capa de silicone premium', 19.90, 'produto'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Recuperação de Dados', 'Recuperação de arquivos deletados', 120.00, 'servico'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Carregador Wireless', 'Carregador sem fio 15W', 79.90, 'produto'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Formatação', 'Formatação e reinstalação', 60.00, 'servico'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Película 3D', 'Película de vidro 3D', 15.90, 'produto');

-- Fornecedores de teste
INSERT INTO fornecedores (empresa_id, nome, cnpj, telefone, email, endereco, cidade, estado, cep, ativo) VALUES
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Distribuidora Tech Ltda', '11.111.111/0001-11', '(11) 3333-3333', 'contato@tech.com.br', 'Rua dos Fornecedores, 100', 'São Paulo', 'SP', '01234-567', true),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Importadora Global', '22.222.222/0001-22', '(11) 4444-4444', 'vendas@global.com.br', 'Av. das Importações, 200', 'São Paulo', 'SP', '01234-568', true),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Suprimentos Express', '33.333.333/0001-33', '(11) 5555-5555', 'pedidos@express.com.br', 'Rua dos Suprimentos, 300', 'São Paulo', 'SP', '01234-569', false),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Atacado Digital', '44.444.444/0001-44', '(11) 6666-6666', 'atacado@digital.com.br', 'Av. do Atacado, 400', 'São Paulo', 'SP', '01234-570', true);

-- Lembretes de teste
INSERT INTO lembretes (empresa_id, titulo, descricao, data_lembrete, status, prioridade) VALUES
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Fechar caixa', 'Fechar caixa antes do final do dia', NOW() + INTERVAL '2 hours', 'pendente', 'alta'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Verificar estoque', 'Verificar estoque de baterias', NOW() + INTERVAL '1 day', 'pendente', 'normal'),
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 'Contatar fornecedor', 'Contatar fornecedor sobre pedido', NOW() + INTERVAL '3 hours', 'pendente', 'alta');

-- Turno de caixa aberto (para teste)
INSERT INTO turnos_caixa (empresa_id, usuario_id, data_abertura, valor_abertura, status) VALUES
('22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed', 
 (SELECT id FROM usuarios WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' LIMIT 1),
 NOW(), 100.00, 'aberto');

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Verificar produtos e serviços
SELECT 
  tipo,
  COUNT(*) as quantidade,
  SUM(preco) as valor_total
FROM produtos_servicos 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed'
GROUP BY tipo;

-- Verificar fornecedores
SELECT 
  COUNT(*) as total_fornecedores,
  COUNT(CASE WHEN ativo = true THEN 1 END) as fornecedores_ativos
FROM fornecedores 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed';

-- Verificar lembretes pendentes
SELECT COUNT(*) as lembretes_pendentes
FROM lembretes 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' 
AND status = 'pendente';

-- Verificar caixa aberto
SELECT COUNT(*) as turnos_abertos
FROM turnos_caixa 
WHERE empresa_id = '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed' 
AND status = 'aberto'; 