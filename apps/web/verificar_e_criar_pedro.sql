-- =====================================================
-- VERIFICAR E CRIAR PEDRO SE NECESSÁRIO
-- =====================================================

-- 1. Ver TODOS os usuários que existem no banco
SELECT 
  'TODOS OS USUÁRIOS NO BANCO' as info,
  id,
  nome,
  nivel,
  email,
  auth_user_id
FROM usuarios 
ORDER BY nome;

-- 2. Contar quantos usuários existem
SELECT 
  'TOTAL DE USUÁRIOS' as info,
  COUNT(*) as total
FROM usuarios;

-- 3. Verificar se Pedro existe
SELECT 
  'PEDRO EXISTE?' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM usuarios WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1') 
    THEN 'SIM' 
    ELSE 'NÃO' 
  END as existe;

-- 4. Se Pedro não existe, vamos criá-lo
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
) 
SELECT 
  '1102c335-5991-43f2-858e-ed130d69edc1',
  '2f17436e-f57a-4c17-8efc-672ad7e85530',
  (SELECT id FROM empresas LIMIT 1), -- Pegar a primeira empresa
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
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1'
);

-- 5. Verificar se Pedro foi criado
SELECT 
  'PEDRO APÓS INSERÇÃO' as resultado,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual,
  empresa_id
FROM usuarios 
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 6. Agora limpar OSs com tecnico_id inválidos e atribuir ao Pedro
UPDATE ordens_servico 
SET tecnico_id = NULL
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT id FROM usuarios);

-- Atribuir todas as OSs sem técnico para o Pedro
UPDATE ordens_servico 
SET tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
WHERE tecnico_id IS NULL;

-- 7. Verificar OSs do Pedro
SELECT 
  'OSs DO PEDRO' as resultado,
  COUNT(*) as total_os,
  string_agg(DISTINCT status, ', ') as status_diferentes
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 8. Testar trigger com OS do Pedro
DO $$
DECLARE
    test_os_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    pedro_existe BOOLEAN;
BEGIN
    -- Verificar se Pedro existe
    SELECT EXISTS (
      SELECT 1 FROM usuarios WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1'
    ) INTO pedro_existe;
    
    IF pedro_existe THEN
        RAISE NOTICE '✅ Pedro existe no banco';
        
        -- Pegar uma OS do Pedro
        SELECT id INTO test_os_id
        FROM ordens_servico 
        WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
        LIMIT 1;
        
        IF test_os_id IS NOT NULL THEN
            -- Garantir que tem valor de serviço
            UPDATE ordens_servico 
            SET valor_servico = 150.00
            WHERE id = test_os_id;
            
            -- Contar comissões antes
            SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
            
            RAISE NOTICE '🔧 Testando trigger com OS: %', test_os_id;
            RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
            
            -- Forçar trigger
            UPDATE ordens_servico 
            SET status = 'ENTREGUE' 
            WHERE id = test_os_id;
            
            -- Aguardar
            PERFORM pg_sleep(1);
            
            -- Contar comissões depois
            SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
            
            RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
            
            IF comissoes_depois > comissoes_antes THEN
                RAISE NOTICE '🎉 SUCESSO! Trigger funcionou! Comissão calculada!';
            ELSE
                RAISE NOTICE '❌ Trigger não funcionou';
            END IF;
        ELSE
            RAISE NOTICE '❌ Nenhuma OS do Pedro encontrada';
        END IF;
    ELSE
        RAISE NOTICE '❌ Pedro não existe no banco';
    END IF;
END $$;

-- 9. Mostrar comissões calculadas
SELECT 
  'COMISSÕES CALCULADAS' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
LEFT JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 5;
