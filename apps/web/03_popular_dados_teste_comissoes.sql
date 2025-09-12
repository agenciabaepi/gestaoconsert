-- =====================================================
-- PASSO 3: POPULAR DADOS DE TESTE PARA COMISSÕES
-- Execute este script APÓS os passos 1 e 2
-- =====================================================

-- 1. Verificar se as colunas existem antes de atualizar
DO $$
BEGIN
  -- Verificar se a coluna comissao_percentual existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'comissao_percentual'
  ) THEN
    -- Atualizar técnicos existentes com comissões
    UPDATE usuarios 
    SET 
      comissao_percentual = 10.00,
      comissao_ativa = true,
      comissao_observacoes = 'Comissão padrão ativada automaticamente'
    WHERE nivel = 'tecnico' AND empresa_id IS NOT NULL;
    
    RAISE NOTICE 'Técnicos atualizados com comissões';
  ELSE
    RAISE NOTICE 'Coluna comissao_percentual não encontrada. Execute primeiro o script 01_criar_tabelas_comissoes.sql';
  END IF;
END $$;

-- 2. Verificar se a coluna tipo existe antes de atualizar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'tipo'
  ) THEN
    -- Configurar OSs existentes como tipo 'normal'
    UPDATE ordens_servico 
    SET tipo = 'normal'
    WHERE tipo IS NULL;
    
    RAISE NOTICE 'OSs configuradas como tipo normal';
  ELSE
    RAISE NOTICE 'Coluna tipo não encontrada na tabela ordens_servico. Execute primeiro o script 01_criar_tabelas_comissoes.sql';
  END IF;
END $$;

-- 3. Criar algumas OSs de teste como ENTREGUE para gerar comissões
-- (Apenas se existirem OSs para atualizar)
DO $$
DECLARE
  os_count INTEGER;
BEGIN
  -- Contar OSs disponíveis para teste
  SELECT COUNT(*) INTO os_count
  FROM ordens_servico 
  WHERE status IN ('CONCLUIDO', 'FINALIZADO') 
    AND tecnico_id IS NOT NULL 
    AND valor_servico IS NOT NULL;
  
  IF os_count > 0 THEN
    -- Atualizar algumas OSs para ENTREGUE para teste
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      tipo = 'normal',
      valor_servico = COALESCE(valor_servico::DECIMAL, 100.00),
      valor_peca = COALESCE(valor_peca::DECIMAL, 50.00),
      valor_faturado = COALESCE(valor_faturado::DECIMAL, 150.00)
    WHERE id IN (
      SELECT id 
      FROM ordens_servico 
      WHERE status IN ('CONCLUIDO', 'FINALIZADO') 
      AND tecnico_id IS NOT NULL 
      LIMIT LEAST(os_count, 5)  -- Máximo 5 OSs ou o total disponível
    );
    
    RAISE NOTICE 'OSs de teste configuradas como ENTREGUE: %', LEAST(os_count, 5);
  ELSE
    RAISE NOTICE 'Nenhuma OS encontrada para configurar como teste';
  END IF;
END $$;

-- 4. Criar algumas OSs de retorno para teste
UPDATE ordens_servico 
SET tipo = 'retorno'
WHERE id IN (
  SELECT id 
  FROM ordens_servico 
  WHERE status = 'ENTREGUE' 
  AND tecnico_id IS NOT NULL 
  AND tipo = 'normal'
  LIMIT 2
);

-- 5. Verificar resultado das configurações
SELECT 
  'Técnicos com comissão ativa' as tipo,
  COUNT(*) as quantidade
FROM usuarios 
WHERE nivel = 'tecnico' AND comissao_ativa = true

UNION ALL

SELECT 
  'OSs marcadas como entregue' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE status = 'ENTREGUE'

UNION ALL

SELECT 
  'OSs de retorno' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE tipo = 'retorno'

UNION ALL

SELECT 
  'Comissões calculadas' as tipo,
  COUNT(*) as quantidade
FROM comissoes_historico

UNION ALL

SELECT 
  'Configurações de empresa' as tipo,
  COUNT(*) as quantidade
FROM configuracoes_comissao;

-- 6. Mostrar exemplo de comissões que foram ou serão geradas
SELECT 
  u.nome as tecnico,
  os.numero_os,
  COALESCE(os.valor_servico, '0') as valor_servico,
  COALESCE(os.valor_faturado, '0') as valor_faturado,
  u.comissao_percentual,
  CASE 
    WHEN u.comissao_ativa THEN 
      (COALESCE(os.valor_servico::DECIMAL, 0) * u.comissao_percentual / 100)
    ELSE 0 
  END as comissao_esperada,
  os.status,
  COALESCE(os.tipo, 'normal') as tipo_os
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE' 
  AND u.nivel = 'tecnico'
ORDER BY u.nome, os.numero_os;

-- 7. Mostrar comissões já calculadas (se houver)
SELECT 
  u.nome as tecnico,
  os.numero_os,
  ch.valor_servico,
  ch.percentual_comissao,
  ch.valor_comissao,
  ch.tipo_ordem,
  ch.status,
  ch.data_entrega,
  ch.observacoes
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
JOIN ordens_servico os ON ch.ordem_servico_id = os.id
ORDER BY ch.data_entrega DESC;

-- 8. Finalização
DO $$
BEGIN
  RAISE NOTICE 'Script de dados de teste executado com sucesso!';
END $$;
