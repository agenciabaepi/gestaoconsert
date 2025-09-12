-- =====================================================
-- TESTE DIRETO COM O PEDRO QUE JÁ EXISTE
-- =====================================================

-- 1. Confirmar que Pedro existe (com o ID do seu arquivo)
SELECT 
  'PEDRO CONFIRMADO' as info,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual,
  auth_user_id
FROM usuarios 
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 2. Ver OSs que estão usando o auth_user_id em vez do id correto
SELECT 
  'OSs COM AUTH_USER_ID ERRADO' as problema,
  id as os_id,
  numero_os,
  tecnico_id,
  status,
  valor_servico
FROM ordens_servico 
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530' -- auth_user_id do Pedro
LIMIT 3;

-- 3. CORRIGIR: Trocar auth_user_id pelo id correto do Pedro
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1' -- ID correto do Pedro
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'; -- auth_user_id errado

-- 4. Verificar se corrigiu
SELECT 
  'OSs CORRIGIDAS PARA PEDRO' as resultado,
  COUNT(*) as total_os,
  string_agg(DISTINCT status, ', ') as status_diferentes
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 5. Verificar se trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 6. Verificar se função existe
SELECT 
  'FUNÇÃO STATUS' as info,
  routine_name
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

-- 7. Teste manual do trigger
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    valor_atual NUMERIC;
BEGIN
    -- Pegar uma OS do Pedro (ID correto)
    SELECT id, COALESCE(valor_servico, 0) 
    INTO test_os_id, valor_atual
    FROM ordens_servico 
    WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        RAISE NOTICE '🔧 OS encontrada: %, Valor atual: R$ %', test_os_id, valor_atual;
        
        -- Se não tem valor, colocar um
        IF valor_atual = 0 THEN
            UPDATE ordens_servico 
            SET valor_servico = 200.00
            WHERE id = test_os_id;
            RAISE NOTICE '💰 Valor atualizado para R$ 200,00';
        END IF;
        
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Mudar status para ENTREGUE (isso deve disparar o trigger)
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        RAISE NOTICE '✅ Status alterado para ENTREGUE';
        
        -- Aguardar um pouco
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionou! Nova comissão calculada!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou...';
            
            -- Vamos tentar executar a função manualmente
            RAISE NOTICE '🔄 Tentando executar função manualmente...';
            PERFORM calcular_comissao_entrega();
            
            -- Verificar novamente
            SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
            IF comissoes_depois > comissoes_antes THEN
                RAISE NOTICE '✅ Função manual funcionou!';
            ELSE
                RAISE NOTICE '❌ Nem a função manual funcionou';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhuma OS do Pedro encontrada';
    END IF;
END $$;

-- 8. Mostrar comissões existentes
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  ch.*,
  u.nome as tecnico_nome
FROM comissoes_historico ch
LEFT JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 3;
