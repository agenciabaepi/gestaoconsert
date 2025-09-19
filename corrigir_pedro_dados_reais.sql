-- =====================================================
-- CORRIGIR PEDRO COM DADOS REAIS
-- =====================================================

-- 1. Mostrar o problema atual
SELECT 
  'PROBLEMA IDENTIFICADO' as info,
  'OS usando auth_user_id como tecnico_id' as problema,
  '2f17436e-f57a-4c17-8efc-672ad7e85530' as auth_user_id_incorreto,
  '1102c335-5991-43f2-858e-ed130d69edc1' as usuarios_id_correto;

-- 2. Verificar Pedro nos dados reais
SELECT 
  'PEDRO REAL' as info,
  id as usuarios_id,
  auth_user_id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE auth_user_id = '2f17436e-f57a-4c17-8efc-672ad7e85530'
   OR id = '1102c335-5991-43f2-858e-ed130d69edc1'
   OR nome ILIKE '%pedro%';

-- 3. Verificar OSs com problema
SELECT 
  'OSs COM AUTH_USER_ID COMO TECNICO_ID' as problema,
  id as os_id,
  numero_os,
  tecnico_id as auth_user_id_incorreto,
  status
FROM ordens_servico 
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530';

-- 4. CORRIGIR: Mapear auth_user_id para usuarios.id do Pedro
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
WHERE tecnico_id = '2f17436e-f57a-4c17-8efc-672ad7e85530';

-- 5. Verificar quantas OSs foram corrigidas
SELECT 
  'CORREÇÃO REALIZADA' as resultado,
  COUNT(*) as os_corrigidas
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 6. Garantir que Pedro tem comissão ativa
UPDATE usuarios 
SET 
  comissao_ativa = true,
  comissao_percentual = COALESCE(comissao_percentual, 15.00),
  nivel = 'tecnico'
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 7. Verificar se há outras OSs com auth_user_id como tecnico_id
SELECT 
  'OUTRAS OSs COM PROBLEMA' as verificacao,
  os.tecnico_id as possiveis_auth_user_ids,
  COUNT(*) as total_os
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios)
  AND os.tecnico_id IN (SELECT auth_user_id FROM usuarios)
GROUP BY os.tecnico_id;

-- 8. Corrigir TODAS as OSs que usam auth_user_id como tecnico_id
UPDATE ordens_servico 
SET tecnico_id = u.id
FROM usuarios u 
WHERE ordens_servico.tecnico_id = u.auth_user_id
  AND ordens_servico.tecnico_id != u.id;

-- 9. Verificação final
SELECT 
  'VERIFICAÇÃO FINAL' as resultado,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS OS TECNICO_IDs CORRETOS!'
    ELSE CONCAT('❌ Ainda há ', COUNT(*), ' OSs com problema')
  END as status
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 10. Mostrar OSs do Pedro corrigidas
SELECT 
  'OSs DO PEDRO APÓS CORREÇÃO' as resultado,
  os.id,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome,
  os.status,
  os.valor_servico
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE u.nome ILIKE '%pedro%'
ORDER BY os.numero_os DESC
LIMIT 5;

-- 11. Testar trigger com OS real do Pedro
DO $$
DECLARE
    pedro_id UUID := '1102c335-5991-43f2-858e-ed130d69edc1';
    os_teste UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar uma OS do Pedro que não seja ENTREGUE
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_id 
      AND status != 'ENTREGUE'
      AND valor_servico > 0
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando trigger com OS % do Pedro', os_teste;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Garantir valor de serviço e marcar como ENTREGUE
        UPDATE ordens_servico 
        SET 
          status = 'ENTREGUE',
          valor_servico = COALESCE(valor_servico, 200.00),
          tipo = 'manutencao'
        WHERE id = os_teste;
        
        -- Aguardar trigger
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Trigger funcionando com Pedro!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS adequada do Pedro encontrada';
    END IF;
END $$;
