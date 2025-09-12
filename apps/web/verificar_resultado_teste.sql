-- =====================================================
-- VERIFICAR RESULTADO DO TESTE
-- =====================================================

-- 1. Ver quantas comissões existem agora
SELECT 
  'TOTAL COMISSÕES' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 2. Ver todas as comissões (se existirem)
SELECT 
  'COMISSÕES EXISTENTES' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_servico,
  ch.percentual_comissao,
  ch.valor_comissao,
  ch.ordem_servico_id,
  os.numero_os,
  ch.data_entrega,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
ORDER BY ch.created_at DESC;

-- 3. Ver status atual da OS 917
SELECT 
  'OS 917 STATUS ATUAL' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo,
  tecnico_id
FROM ordens_servico 
WHERE numero_os = '917';

-- 4. Se não funcionou, testar com logs habilitados
DO $$
DECLARE
    os_id_917 UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar ID da OS 917
    SELECT id INTO os_id_917 FROM ordens_servico WHERE numero_os = '917';
    
    -- Contar comissões
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'TESTE DIRETO: OS 917 ID = %', os_id_917;
    RAISE NOTICE 'Comissões antes = %', comissoes_antes;
    
    -- Primeiro, garantir que não está ENTREGUE
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_id_917;
    
    RAISE NOTICE 'Mudou para EM_ANALISE primeiro';
    
    -- Agora mudar para ENTREGUE
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = 1500.00,
      tipo = 'manutencao'
    WHERE id = os_id_917;
    
    RAISE NOTICE 'Mudou para ENTREGUE - aguardando trigger...';
    
    -- Aguardar
    PERFORM pg_sleep(3);
    
    -- Verificar resultado
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'Comissões depois = %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 TRIGGER FUNCIONOU!';
    ELSE
        RAISE NOTICE '❌ Trigger não disparou - investigar função';
    END IF;
END $$;

-- 5. Verificar novamente as comissões
SELECT 
  'VERIFICAÇÃO FINAL' as resultado,
  COUNT(*) as total_comissoes_final
FROM comissoes_historico;
