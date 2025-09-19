-- =====================================================
-- INSERIR PEDRO NO BANCO DE DADOS
-- =====================================================

-- 1. Primeiro, vamos ver quais usuários existem
SELECT 
  'USUÁRIOS EXISTENTES' as info,
  id,
  nome,
  nivel,
  email
FROM usuarios 
ORDER BY nome;

-- 2. Inserir o Pedro Oliveira
INSERT INTO usuarios (
  id,
  auth_user_id,
  empresa_id,
  nome,
  email,
  whatsapp,
  tipo,
  created_at,
  nivel,
  cpf,
  telefone,
  permissoes,
  usuario,
  comissao_percentual,
  comissao_ativa,
  comissao_observacoes
) VALUES (
  '1102c335-5991-43f2-858e-ed130d69edc1',
  '2f17436e-f57a-4c17-8efc-672ad7e85530',
  '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
  'Pedro Oliveira',
  'pedro@gmail.com',
  '12312312312',
  'principal',
  NOW(),
  'tecnico',
  '12312312312',
  '',
  '{"bancada","dashboard"}',
  'pedro',
  10.00,
  true,
  'Comissão ativada - 10% sobre serviços'
)
ON CONFLICT (id) DO UPDATE SET
  comissao_percentual = 10.00,
  comissao_ativa = true,
  comissao_observacoes = 'Comissão ativada - 10% sobre serviços';

-- 3. Verificar se foi inserido
SELECT 
  'PEDRO INSERIDO' as resultado,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome = 'Pedro Oliveira';

-- 4. Agora corrigir as OSs para usar o ID correto do Pedro
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- 5. Verificar quantas OSs foram corrigidas
SELECT 
  'OSs CORRIGIDAS' as resultado,
  COUNT(*) as total_os_pedro
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 6. Testar o trigger agora
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar uma OS do Pedro
    SELECT os.id INTO test_os_id
    FROM ordens_servico os
    WHERE os.tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
      AND os.valor_servico > 0
    LIMIT 1;
    
    IF test_os_id IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando trigger com OS: %, Comissões antes: %', test_os_id, comissoes_antes;
        
        -- Forçar trigger
        UPDATE ordens_servico 
        SET status = 'APROVADO' 
        WHERE id = test_os_id;
        
        UPDATE ordens_servico 
        SET status = 'ENTREGUE' 
        WHERE id = test_os_id;
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE 'SUCESSO! Trigger funcionou!';
        ELSE
            RAISE NOTICE 'Trigger ainda não funcionou...';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS do Pedro encontrada';
    END IF;
END $$;

-- 7. Verificar resultado final
SELECT 
  'RESULTADO FINAL' as info,
  COUNT(*) as total_comissoes,
  SUM(valor_comissao) as valor_total
FROM comissoes_historico;
