-- =====================================================
-- TESTE FINAL SIMPLES - SEM ON CONFLICT
-- =====================================================

-- 1. Ver se existem usuários
SELECT 
  'USUÁRIOS EXISTENTES' as info,
  COUNT(*) as total,
  string_agg(nome, ', ') as nomes
FROM usuarios;

-- 2. Se existem usuários, pegar o primeiro e fazer técnico
DO $$
DECLARE
    user_id UUID;
    user_name TEXT;
BEGIN
    SELECT id, nome INTO user_id, user_name FROM usuarios LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        UPDATE usuarios 
        SET 
          nivel = 'tecnico',
          comissao_ativa = true,
          comissao_percentual = 25.00,
          comissao_observacoes = 'Ativado para teste de comissões'
        WHERE id = user_id;
        
        RAISE NOTICE 'Usuário % virou técnico com ID %', user_name, user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado!';
    END IF;
END $$;

-- 3. Ver o técnico configurado
SELECT 
  'TÉCNICO CONFIGURADO' as info,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nivel = 'tecnico'
LIMIT 1;

-- 4. Verificar se temos clientes e empresas
SELECT 
  'DADOS NECESSÁRIOS' as info,
  (SELECT COUNT(*) FROM usuarios WHERE nivel = 'tecnico') as tecnicos,
  (SELECT COUNT(*) FROM clientes) as clientes,
  (SELECT COUNT(*) FROM empresas) as empresas;

-- 5. Criar OS manual simples (sem ON CONFLICT)
DO $$
DECLARE
    tecnico_id UUID;
    cliente_id UUID;
    empresa_id UUID;
    os_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO tecnico_id FROM usuarios WHERE nivel = 'tecnico' LIMIT 1;
    SELECT id INTO cliente_id FROM clientes LIMIT 1;
    SELECT id INTO empresa_id FROM empresas LIMIT 1;
    
    IF tecnico_id IS NOT NULL AND cliente_id IS NOT NULL AND empresa_id IS NOT NULL THEN
        INSERT INTO ordens_servico (
          id, empresa_id, cliente_id, tecnico_id, status, created_at, 
          numero_os, valor_servico, categoria, marca, modelo, relato
        ) VALUES (
          os_id, empresa_id, cliente_id, tecnico_id, 'APROVADO', NOW(),
          999997, 600.00, 'TESTE', 'TESTE', 'TESTE', 'Teste de comissão'
        );
        
        RAISE NOTICE 'OS criada com ID: %', os_id;
    ELSE
        RAISE NOTICE 'Dados insuficientes: tecnico=%, cliente=%, empresa=%', tecnico_id, cliente_id, empresa_id;
    END IF;
END $$;

-- 6. Ver a OS criada
SELECT 
  'OS CRIADA' as info,
  os.id,
  os.numero_os,
  u.nome as tecnico_nome,
  os.status,
  os.valor_servico
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.numero_os = 999997;

-- 7. Contar comissões ANTES
SELECT 
  'COMISSÕES ANTES' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 8. DISPARAR TRIGGER
UPDATE ordens_servico 
SET status = 'ENTREGUE'
WHERE numero_os = 999997;

-- 9. Aguardar
SELECT pg_sleep(3);

-- 10. Contar comissões DEPOIS
SELECT 
  'COMISSÕES DEPOIS' as info,
  COUNT(*) as total
FROM comissoes_historico;

-- 11. Ver comissão criada
SELECT 
  'COMISSÃO CRIADA' as resultado,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC
LIMIT 1;

-- 12. Status do trigger
SELECT 
  'TRIGGER STATUS' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_calcular_comissao'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- 13. Teste final: se não funcionou, testar função manual
DO $$
DECLARE
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'Comissões antes da função manual: %', comissoes_antes;
    
    BEGIN
        PERFORM calcular_comissao_entrega();
        RAISE NOTICE 'Função manual executada';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro na função manual: %', SQLERRM;
    END;
    
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'Comissões depois da função manual: %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 FUNÇÃO MANUAL FUNCIONOU!';
    ELSE
        RAISE NOTICE '❌ Nem função manual funcionou';
    END IF;
END $$;

-- 14. Limpar
DELETE FROM ordens_servico WHERE numero_os = 999997;