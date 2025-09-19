-- =====================================================
-- TESTE FINAL - VERIFICAR SE SISTEMA ESTÁ FUNCIONANDO
-- =====================================================

-- 1. Verificar se todas as tabelas existem
SELECT 
  'TABELAS DO SISTEMA' as info,
  table_name,
  CASE 
    WHEN table_name = 'usuarios' THEN 'Usuários e técnicos'
    WHEN table_name = 'ordens_servico' THEN 'Ordens de serviço'
    WHEN table_name = 'comissoes_historico' THEN 'Histórico de comissões'
    WHEN table_name = 'configuracoes_comissao' THEN 'Configurações de comissão'
    ELSE 'Outra tabela'
  END as descricao
FROM information_schema.tables 
WHERE table_name IN ('usuarios', 'ordens_servico', 'comissoes_historico', 'configuracoes_comissao')
ORDER BY table_name;

-- 2. Verificar técnicos ativos
SELECT 
  'TÉCNICOS ATIVOS' as info,
  id,
  nome,
  comissao_ativa,
  comissao_percentual,
  auth_user_id
FROM usuarios 
WHERE nivel = 'tecnico' AND comissao_ativa = true;

-- 3. Verificar OSs entregues
SELECT 
  'OSs ENTREGUES' as info,
  os.id,
  os.numero_os,
  os.status,
  os.valor_servico,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.status = 'ENTREGUE'
ORDER BY os.created_at DESC
LIMIT 3;

-- 4. Verificar comissões calculadas
SELECT 
  'COMISSÕES CALCULADAS' as info,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_comissao,
  ch.percentual_comissao,
  ch.ordem_servico_id,
  ch.data_entrega,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON ch.tecnico_id = u.id
ORDER BY ch.created_at DESC;

-- 5. Verificar se trigger existe
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 6. Verificar configurações da empresa
SELECT 
  'CONFIGURAÇÕES EMPRESA' as info,
  cc.empresa_id,
  e.nome as empresa_nome,
  cc.comissao_padrao,
  cc.comissao_apenas_servico,
  cc.comissao_retorno_ativo
FROM configuracoes_comissao cc
JOIN empresas e ON cc.empresa_id = e.id;

-- 7. TESTE FINAL: Criar uma nova OS e ver se dispara o trigger
DO $$
DECLARE
    novo_os_id UUID := gen_random_uuid();
    tecnico_id_valido UUID;
    cliente_id_valido UUID;
    empresa_id_valida UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Pegar IDs válidos
    SELECT id INTO tecnico_id_valido FROM usuarios WHERE comissao_ativa = true LIMIT 1;
    SELECT id INTO cliente_id_valido FROM clientes LIMIT 1;
    SELECT id INTO empresa_id_valida FROM empresas LIMIT 1;
    
    IF tecnico_id_valido IS NOT NULL AND cliente_id_valido IS NOT NULL AND empresa_id_valida IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        -- Criar nova OS
        INSERT INTO ordens_servico (
            id, empresa_id, cliente_id, tecnico_id, status, created_at,
            numero_os, valor_servico, categoria, marca, modelo, relato,
            atendente, tecnico
        ) VALUES (
            novo_os_id, empresa_id_valida, cliente_id_valido, tecnico_id_valido, 'APROVADO', NOW(),
            999996, 400.00, 'TESTE FINAL', 'TESTE', 'TESTE', 'Teste final do sistema',
            'ADMIN', (SELECT nome FROM usuarios WHERE id = tecnico_id_valido)
        );
        
        RAISE NOTICE '📝 Nova OS criada: %', novo_os_id;
        
        -- Marcar como ENTREGUE para disparar trigger
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = novo_os_id;
        
        RAISE NOTICE '✅ OS marcada como ENTREGUE';
        
        -- Aguardar um pouco
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE '📊 Comissões: antes=%, depois=%', comissoes_antes, comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SUCESSO! Sistema funcionando perfeitamente!';
        ELSE
            RAISE NOTICE '❌ Algo ainda não está funcionando';
        END IF;
        
        -- Limpar a OS de teste
        DELETE FROM ordens_servico WHERE id = novo_os_id;
        RAISE NOTICE '🧹 OS de teste removida';
        
    ELSE
        RAISE NOTICE '❌ Não foi possível fazer o teste - dados insuficientes';
        RAISE NOTICE 'Tecnico: %, Cliente: %, Empresa: %', tecnico_id_valido, cliente_id_valido, empresa_id_valida;
    END IF;
END $$;

-- 8. Resumo final
SELECT 
  'RESUMO FINAL DO SISTEMA' as info,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as os_entregues,
  (SELECT COUNT(*) FROM comissoes_historico) as comissoes_total,
  (SELECT SUM(valor_comissao) FROM comissoes_historico) as valor_total_comissoes,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_calcular_comissao')
    THEN 'ATIVO' 
    ELSE 'INATIVO' 
  END as status_trigger;
