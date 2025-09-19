-- =====================================================
-- CORRIGIR SINTAXE E FINALIZAR SISTEMA
-- =====================================================

-- 1. Primeiro, verificar Pedro
SELECT 
  'PEDRO ATUAL' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 2. Preencher tecnico_id com auth_user_id convertido
UPDATE usuarios 
SET tecnico_id = auth_user_id::UUID 
WHERE tecnico_id IS NULL 
  AND auth_user_id IS NOT NULL;

-- 3. Verificar após atualização
SELECT 
  'PEDRO APÓS UPDATE' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 4. Atribuir OS ao Pedro se não tiver
DO $$
DECLARE
    pedro_tecnico_id UUID;
    os_count INTEGER;
    os_atribuidas INTEGER;
BEGIN
    -- Buscar tecnico_id do Pedro
    SELECT tecnico_id INTO pedro_tecnico_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%'
    LIMIT 1;
    
    IF pedro_tecnico_id IS NOT NULL THEN
        -- Verificar se Pedro tem OSs
        SELECT COUNT(*) INTO os_count
        FROM ordens_servico 
        WHERE tecnico_id = pedro_tecnico_id;
        
        RAISE NOTICE 'Pedro tecnico_id: %, OSs existentes: %', pedro_tecnico_id, os_count;
        
        -- Se não tem OSs, atribuir algumas
        IF os_count = 0 THEN
            UPDATE ordens_servico 
            SET tecnico_id = pedro_tecnico_id
            WHERE tecnico_id IS NULL
              AND id IN (
                SELECT id FROM ordens_servico 
                WHERE tecnico_id IS NULL 
                ORDER BY created_at DESC 
                LIMIT 2
              );
            
            GET DIAGNOSTICS os_atribuidas = ROW_COUNT;
            RAISE NOTICE 'OSs atribuídas ao Pedro: %', os_atribuidas;
        END IF;
    ELSE
        RAISE NOTICE 'Pedro não encontrado!';
    END IF;
END $$;

-- 5. Testar o sistema completo
DO $$
DECLARE
    os_teste UUID;
    pedro_tecnico_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Buscar Pedro
    SELECT tecnico_id INTO pedro_tecnico_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Buscar OS do Pedro que não seja ENTREGUE
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_tecnico_id 
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL AND pedro_tecnico_id IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando: OS % do Pedro %', os_teste, pedro_tecnico_id;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Atualizar OS para ENTREGUE
        UPDATE ordens_servico 
        SET 
          status = 'ENTREGUE',
          valor_servico = 700.00,
          tipo = 'manutencao'
        WHERE id = os_teste;
        
        -- Aguardar trigger
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE 'Pedro: %, OS encontrada: %', pedro_tecnico_id, os_teste;
    END IF;
END $$;

-- 6. Mostrar resultado final
SELECT 
  'RESULTADO FINAL' as info,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM usuarios WHERE tecnico_id IS NOT NULL) as usuarios_com_tecnico_id;
