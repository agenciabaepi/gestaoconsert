-- =====================================================
-- VERIFICAR OSs PEDRO E TESTE FORÇADO
-- =====================================================

-- 1. Ver todas as OSs do Pedro
SELECT 
  'OSs DO PEDRO' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo,
  created_at
FROM ordens_servico 
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
ORDER BY created_at DESC;

-- 2. Se Pedro não tem OSs, atribuir algumas
UPDATE ordens_servico 
SET tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
WHERE tecnico_id IS NULL
  AND id IN (
    SELECT id FROM ordens_servico 
    WHERE tecnico_id IS NULL 
    ORDER BY created_at DESC 
    LIMIT 2
  );

-- 3. Verificar OSs após atribuição
SELECT 
  'OSs APÓS ATRIBUIÇÃO' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo
FROM ordens_servico 
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
ORDER BY created_at DESC;

-- 4. TESTE FORÇADO - pegar qualquer OS do Pedro
DO $$
DECLARE
    os_para_teste UUID;
    status_atual TEXT;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar primeira OS do Pedro (qualquer status)
    SELECT id, status INTO os_para_teste, status_atual
    FROM ordens_servico 
    WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF os_para_teste IS NOT NULL THEN
        RAISE NOTICE 'TESTE FORÇADO: OS %, Status atual: %', os_para_teste, status_atual;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Primeiro, mudar para outro status (para garantir que OLD != NEW)
        UPDATE ordens_servico 
        SET status = 'EM_ANALISE'
        WHERE id = os_para_teste;
        
        -- Agora mudar para ENTREGUE (isso vai disparar o trigger)
        UPDATE ordens_servico 
        SET 
          status = 'ENTREGUE',
          valor_servico = 1000.00,
          tipo = 'manutencao'
        WHERE id = os_para_teste;
        
        -- Aguardar um pouco
        PERFORM pg_sleep(1);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE '❌ Pedro não tem nenhuma OS!';
    END IF;
END $$;

-- 5. Verificar se inseriu na tabela de comissões
SELECT 
  'COMISSÕES INSERIDAS' as resultado,
  ch.*,
  u.nome as tecnico_nome
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
ORDER BY ch.created_at DESC
LIMIT 5;
