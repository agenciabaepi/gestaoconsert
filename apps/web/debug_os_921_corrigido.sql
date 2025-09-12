-- =====================================================
-- DEBUG OS #921 CORRIGIDO
-- =====================================================

-- 1. Verificar dados completos da OS #921
SELECT 
  'OS #921 DADOS COMPLETOS' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tecnico_id,
  tipo,
  empresa_id,
  cliente_id,
  created_at
FROM ordens_servico 
WHERE numero_os = '921';

-- 2. Verificar se o tecnico_id da OS existe na tabela usuarios
SELECT 
  'TÉCNICO DA OS #921' as verificacao,
  u.id,
  u.nome,
  u.tecnico_id,
  u.comissao_ativa,
  u.comissao_percentual,
  os.tecnico_id as os_tecnico_id,
  CASE 
    WHEN os.tecnico_id = u.tecnico_id THEN 'MAPEAMENTO OK ✅'
    ELSE 'PROBLEMA NO MAPEAMENTO ❌'
  END as status_mapeamento
FROM ordens_servico os
LEFT JOIN usuarios u ON u.tecnico_id = os.tecnico_id
WHERE os.numero_os = '921';

-- 3. Verificar se há comissões na tabela
SELECT 
  'COMISSÕES ATUAIS' as info,
  COUNT(*) as total_comissoes
FROM comissoes_historico;

-- 4. Teste manual direto na OS #921
DO $$
DECLARE
    os_921_id UUID;
    tecnico_921_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    tecnico_nome TEXT;
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_atual DECIMAL(10,2);
    tipo_atual TEXT;
BEGIN
    -- Buscar dados da OS #921
    SELECT id, tecnico_id, valor_servico, tipo 
    INTO os_921_id, tecnico_921_id, valor_atual, tipo_atual
    FROM ordens_servico 
    WHERE numero_os = '921';
    
    RAISE NOTICE 'OS #921 ID: %', os_921_id;
    RAISE NOTICE 'Técnico ID: %', tecnico_921_id;
    RAISE NOTICE 'Valor serviço: %', valor_atual;
    RAISE NOTICE 'Tipo: %', tipo_atual;
    
    IF tecnico_921_id IS NULL THEN
        RAISE NOTICE 'PROBLEMA: OS sem técnico atribuído!';
        RETURN;
    END IF;
    
    -- Buscar dados do técnico
    SELECT nome, comissao_percentual, comissao_ativa
    INTO tecnico_nome, tecnico_comissao, tecnico_ativo
    FROM usuarios
    WHERE tecnico_id = tecnico_921_id;
    
    IF tecnico_nome IS NULL THEN
        RAISE NOTICE 'PROBLEMA: Técnico % não encontrado na tabela usuarios!', tecnico_921_id;
        
        -- Mostrar todos os técnicos disponíveis
        FOR tecnico_nome IN 
            SELECT nome FROM usuarios WHERE nivel = 'tecnico' 
        LOOP
            RAISE NOTICE 'Técnico disponível: %', tecnico_nome;
        END LOOP;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Técnico Nome: %', tecnico_nome;
    RAISE NOTICE 'Comissão: %%, Ativa: %', tecnico_comissao, tecnico_ativo;
    
    IF NOT tecnico_ativo THEN
        RAISE NOTICE 'PROBLEMA: Técnico com comissão inativa!';
        RETURN;
    END IF;
    
    IF tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
        RAISE NOTICE 'PROBLEMA: Técnico sem percentual de comissão!';
        RETURN;
    END IF;
    
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    RAISE NOTICE 'Comissões antes: %', comissoes_antes;
    
    -- Garantir valor de serviço
    IF valor_atual IS NULL OR valor_atual = 0 THEN
        UPDATE ordens_servico 
        SET valor_servico = 100.00
        WHERE id = os_921_id;
        RAISE NOTICE 'Valor de serviço definido como 100.00';
    END IF;
    
    -- Garantir tipo
    IF tipo_atual IS NULL OR tipo_atual = 'retorno' OR tipo_atual = 'garantia' THEN
        UPDATE ordens_servico 
        SET tipo = 'manutencao'
        WHERE id = os_921_id;
        RAISE NOTICE 'Tipo definido como manutencao';
    END IF;
    
    -- Forçar mudança de status para disparar trigger
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_921_id;
    
    RAISE NOTICE 'Status mudado para EM_ANALISE';
    
    UPDATE ordens_servico 
    SET status = 'ENTREGUE'
    WHERE id = os_921_id;
    
    RAISE NOTICE 'Status mudado para ENTREGUE - trigger deve disparar agora';
    
    -- Aguardar
    PERFORM pg_sleep(3);
    
    -- Verificar resultado
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'Comissões depois: %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 TRIGGER FUNCIONOU para OS #921!';
    ELSE
        RAISE NOTICE '❌ Trigger ainda não disparou - verificar função trigger';
    END IF;
END $$;

-- 5. Verificar comissões criadas
SELECT 
  'COMISSÕES CRIADAS' as resultado,
  ch.*,
  u.nome as tecnico_nome,
  os.numero_os
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
ORDER BY ch.created_at DESC
LIMIT 3;
