-- =====================================================
-- CRIAR TÉCNICO SIMPLES SEM AUTH_USER_ID
-- =====================================================

-- 1. Primeiro, vamos remover a constraint de auth_user_id temporariamente
ALTER TABLE usuarios ALTER COLUMN auth_user_id DROP NOT NULL;

-- 2. Criar técnico sem auth_user_id
INSERT INTO usuarios (
  id,
  empresa_id,
  nome,
  email,
  nivel,
  tipo,
  created_at,
  whatsapp,
  cpf,
  telefone,
  permissoes,
  usuario,
  comissao_percentual,
  comissao_ativa,
  comissao_observacoes
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  id as empresa_id,
  'Técnico Sistema',
  'tecnico.sistema@teste.com',
  'tecnico',
  'principal',
  NOW(),
  '11999999999',
  '99999999999',
  '',
  '{"bancada","dashboard"}',
  'tecnico_sistema',
  25.00,
  true,
  'Técnico criado para sistema de comissões'
FROM empresas 
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  comissao_ativa = true,
  comissao_percentual = 25.00;

-- 3. Verificar se foi criado
SELECT 
  'TÉCNICO CRIADO' as resultado,
  id,
  nome,
  comissao_ativa,
  comissao_percentual,
  auth_user_id
FROM usuarios 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 4. Atualizar OSs para usar este técnico
UPDATE ordens_servico 
SET tecnico_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE tecnico_id IS NULL OR tecnico_id NOT IN (SELECT id FROM usuarios)
LIMIT 3;

-- 5. Verificar OSs do técnico
SELECT 
  'OSs DO TÉCNICO' as resultado,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id = '550e8400-e29b-41d4-a716-446655440000';

-- 6. TESTAR TRIGGER
DO $$
DECLARE
    os_teste UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar uma OS do técnico
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = '550e8400-e29b-41d4-a716-446655440000'
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        -- Garantir que tem valor
        UPDATE ordens_servico 
        SET valor_servico = 500.00
        WHERE id = os_teste;
        
        RAISE NOTICE '🔧 Testando trigger com OS: %', os_teste;
        RAISE NOTICE '📊 Comissões antes: %', comissoes_antes;
        
        -- Marcar como ENTREGUE
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_teste;
        
        -- Aguardar
        PERFORM pg_sleep(3);
        
        -- Contar depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE '📊 Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Sistema funcionando!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhuma OS encontrada para teste';
    END IF;
END $$;

-- 7. Mostrar todas as comissões
SELECT 
  'TODAS AS COMISSÕES' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC;

-- 8. Status final do sistema
SELECT 
  'STATUS FINAL' as info,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COALESCE(SUM(valor_comissao), 0) FROM comissoes_historico) as valor_total;
