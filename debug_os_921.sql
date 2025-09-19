-- =====================================================
-- DEBUG OS #921 ESPECÍFICA
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
  created_at,
  updated_at
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

-- 4. Verificar se o trigger está ativo
SELECT 
  'TRIGGER STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 5. Verificar RLS na tabela comissoes_historico
SELECT 
  'RLS STATUS' as info,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables 
WHERE tablename = 'comissoes_historico';

-- 6. Teste manual: forçar trigger na OS #921
DO $$
DECLARE
    os_921_id UUID;
    tecnico_921_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
    tecnico_nome TEXT;
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
BEGIN
    -- Buscar dados da OS #921
    SELECT id, tecnico_id INTO os_921_id, tecnico_921_id
    FROM ordens_servico 
    WHERE numero_os = '921';
    
    -- Buscar dados do técnico
    SELECT nome, comissao_percentual, comissao_ativa
    INTO tecnico_nome, tecnico_comissao, tecnico_ativo
    FROM usuarios
    WHERE tecnico_id = tecnico_921_id;
    
    RAISE NOTICE 'OS #921 ID: %', os_921_id;
    RAISE NOTICE 'Técnico ID: %', tecnico_921_id;
    RAISE NOTICE 'Técnico Nome: %', tecnico_nome;
    RAISE NOTICE 'Comissão: %%, Ativa: %', tecnico_comissao, tecnico_ativo;
    
    -- Contar comissões antes
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    RAISE NOTICE 'Comissões antes: %', comissoes_antes;
    
    -- Forçar mudança de status para disparar trigger
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_921_id;
    
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = COALESCE(valor_servico, 100.00),
      tipo = COALESCE(tipo, 'manutencao')
    WHERE id = os_921_id;
    
    RAISE NOTICE 'Status atualizado para ENTREGUE';
    
    -- Aguardar
    PERFORM pg_sleep(2);
    
    -- Verificar resultado
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'Comissões depois: %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 TRIGGER FUNCIONOU para OS #921!';
    ELSE
        RAISE NOTICE '❌ Trigger não disparou para OS #921';
        
        -- Verificar possíveis problemas
        IF tecnico_921_id IS NULL THEN
            RAISE NOTICE 'PROBLEMA: OS sem técnico atribuído';
        ELSIF tecnico_nome IS NULL THEN
            RAISE NOTICE 'PROBLEMA: Técnico não encontrado na tabela usuarios';
        ELSIF NOT tecnico_ativo THEN
            RAISE NOTICE 'PROBLEMA: Técnico com comissão inativa';
        ELSIF tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
            RAISE NOTICE 'PROBLEMA: Técnico sem percentual de comissão';
        ELSE
            RAISE NOTICE 'PROBLEMA: Erro desconhecido no trigger';
        END IF;
    END IF;
END $$;

-- 7. Verificar se inseriu comissão
SELECT 
  'COMISSÕES APÓS TESTE' as resultado,
  ch.*,
  u.nome as tecnico_nome,
  os.numero_os
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
ORDER BY ch.created_at DESC
LIMIT 5;
