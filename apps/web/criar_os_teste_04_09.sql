-- =====================================================
-- CRIAR O.S. DE TESTE PARA 04/09/2025
-- =====================================================

-- Inserir nova O.S. de teste com prazo para 04/09/2025
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
    valor_total,
    prazo_entrega,
    relato,
    observacao
) VALUES (
    'OS-TESTE-0409',
    (SELECT id FROM clientes WHERE empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac' LIMIT 1),
    (SELECT id FROM usuarios WHERE empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac' LIMIT 1),
    '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac',
    'Smartphone',
    'iPhone',
    'iPhone 15',
    'Troca de tela',
    'PENDENTE',
    150.00,
    '2025-09-04T14:00:00+00:00',
    'Tela quebrada, precisa de troca',
    'Cliente solicitou urgência'
);

-- Verificar se foi criada
SELECT 
  id,
  numero_os,
  prazo_entrega,
  status,
  empresa_id,
  relato
FROM ordens_servico 
WHERE numero_os = 'OS-TESTE-0409' 
AND empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac';
