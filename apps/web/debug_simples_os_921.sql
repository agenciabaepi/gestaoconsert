-- =====================================================
-- DEBUG SIMPLES OS #921
-- =====================================================

-- 1. Ver dados da OS #921
SELECT 
  'OS #921' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tecnico_id,
  tipo
FROM ordens_servico 
WHERE numero_os = '921';

-- 2. Ver se o técnico existe
SELECT 
  'TÉCNICO' as info,
  u.nome,
  u.tecnico_id,
  u.comissao_ativa,
  u.comissao_percentual
FROM usuarios u
WHERE u.tecnico_id = (
  SELECT tecnico_id FROM ordens_servico WHERE numero_os = '921'
);

-- 3. Testar trigger simples
DO $$
DECLARE
    os_id UUID;
    antes INTEGER;
    depois INTEGER;
BEGIN
    SELECT id INTO os_id FROM ordens_servico WHERE numero_os = '921';
    SELECT COUNT(*) INTO antes FROM comissoes_historico;
    
    RAISE NOTICE 'Antes: %', antes;
    
    -- Forçar trigger
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_id;
    
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = 100.00,
      tipo = 'manutencao'
    WHERE id = os_id;
    
    PERFORM pg_sleep(2);
    
    SELECT COUNT(*) INTO depois FROM comissoes_historico;
    RAISE NOTICE 'Depois: %', depois;
    
    IF depois > antes THEN
        RAISE NOTICE 'FUNCIONOU!';
    ELSE
        RAISE NOTICE 'NAO FUNCIONOU';
    END IF;
END $$;

-- 4. Ver comissões
SELECT 
  'COMISSÕES' as resultado,
  COUNT(*) as total
FROM comissoes_historico;
