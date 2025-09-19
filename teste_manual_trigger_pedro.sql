-- =====================================================
-- TESTE MANUAL TRIGGER PEDRO
-- =====================================================

-- 1. Verificar se há comissões já calculadas
SELECT 
  'COMISSÕES ATUAIS' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 2. Pegar OS 917 (ORÇAMENTO) para testar
SELECT 
  'OS 917 ANTES DO TESTE' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo,
  tecnico_id
FROM ordens_servico 
WHERE numero_os = '917';

-- 3. TESTE MANUAL: Forçar mudança para ENTREGUE na OS 917
DO $$
DECLARE
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    RAISE NOTICE 'INICIANDO TESTE: Comissões antes = %', comissoes_antes;
    
    -- Atualizar OS 917 para ENTREGUE
    RAISE NOTICE 'Atualizando OS 917 para ENTREGUE...';
    
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = 1200.00,
      tipo = 'manutencao'
    WHERE numero_os = '917';
    
    RAISE NOTICE 'Update executado!';
    
    -- Aguardar
    PERFORM pg_sleep(2);
    
    -- Contar comissões depois
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'RESULTADO: Comissões depois = %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 SUCESSO! Trigger funcionou!';
    ELSE
        RAISE NOTICE '❌ Trigger NÃO disparou';
    END IF;
END $$;

-- 4. Verificar OS 917 após o teste
SELECT 
  'OS 917 APÓS TESTE' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo,
  tecnico_id
FROM ordens_servico 
WHERE numero_os = '917';

-- 5. Verificar se apareceu comissão
SELECT 
  'COMISSÕES APÓS TESTE' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_servico,
  ch.percentual_comissao,
  ch.valor_comissao,
  ch.ordem_servico_id,
  os.numero_os
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
ORDER BY ch.created_at DESC
LIMIT 3;

-- 6. Se não funcionou, verificar se o trigger existe
SELECT 
  'TRIGGER EXISTE?' as verificacao,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';
