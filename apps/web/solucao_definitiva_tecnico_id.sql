-- =====================================================
-- SOLUÇÃO DEFINITIVA TECNICO_ID
-- =====================================================

-- 1. Verificar estrutura atual
SELECT 
  'COLUNAS TECNICO_ID' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE (table_name = 'ordens_servico' AND column_name = 'tecnico_id')
   OR (table_name = 'usuarios' AND column_name = 'auth_user_id')
   OR (table_name = 'usuarios' AND column_name = 'tecnico_id')
ORDER BY table_name, column_name;

-- 2. SOLUÇÃO SIMPLES: Preencher campo tecnico_id em usuarios
-- com o mesmo valor de auth_user_id (convertido para UUID)
UPDATE usuarios 
SET tecnico_id = auth_user_id::UUID 
WHERE tecnico_id IS NULL 
  AND auth_user_id IS NOT NULL;

-- 3. Verificar Pedro após atualização
SELECT 
  'PEDRO ATUALIZADO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  CASE 
    WHEN auth_user_id::UUID = tecnico_id THEN 'SINCRONIZADO ✅'
    ELSE 'PROBLEMA ❌'
  END as status_sync
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 4. Agora podemos usar tecnico_id (UUID) em vez de auth_user_id (TEXT)
SELECT 
  'OSs DO PEDRO (usando tecnico_id UUID)' as info,
  os.id,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome
FROM ordens_servico os
JOIN usuarios u ON u.tecnico_id = os.tecnico_id
WHERE u.nome ILIKE '%pedro%'
LIMIT 3;

-- 5. Se Pedro não tem OSs, atribuir uma
DO $$
DECLARE
    pedro_tecnico_id UUID;
    os_count INTEGER;
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
        
        RAISE NOTICE 'Pedro tecnico_id: %, OSs: %', pedro_tecnico_id, os_count;
        
        -- Se não tem OSs, atribuir uma
        IF os_count = 0 THEN
            UPDATE ordens_servico 
            SET tecnico_id = pedro_tecnico_id
            WHERE tecnico_id IS NULL
            LIMIT 1;
            
            GET DIAGNOSTICS os_count = ROW_COUNT;
            RAISE NOTICE 'OSs atribuídas ao Pedro: %', os_count;
        END IF;
    END IF;
END $$;

-- 6. Atualizar trigger para usar tecnico_id UUID corretamente
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    empresa_os UUID;
    cliente_os UUID;
BEGIN
    RAISE NOTICE 'Trigger: OS %, status %, tecnico_id %', NEW.id, NEW.status, NEW.tecnico_id;
    
    IF NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE') THEN
        
        IF NEW.tecnico_id IS NULL THEN
            RAISE NOTICE 'OS sem técnico';
            RETURN NEW;
        END IF;
        
        -- Buscar técnico por tecnico_id (UUID)
        SELECT comissao_percentual, comissao_ativa
        INTO tecnico_comissao, tecnico_ativo
        FROM usuarios 
        WHERE tecnico_id = NEW.tecnico_id;
        
        IF NOT FOUND THEN
            RAISE NOTICE 'Técnico % não encontrado', NEW.tecnico_id;
            RETURN NEW;
        END IF;
        
        IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
            RAISE NOTICE 'Técnico sem comissão ativa';
            RETURN NEW;
        END IF;
        
        IF NEW.tipo = 'retorno' OR NEW.tipo = 'garantia' THEN
            RAISE NOTICE 'OS é garantia - sem comissão';
            RETURN NEW;
        END IF;
        
        IF NEW.valor_servico IS NULL OR NEW.valor_servico = 0 THEN
            RAISE NOTICE 'OS sem valor de serviço';
            RETURN NEW;
        END IF;
        
        valor_comissao := (NEW.valor_servico * tecnico_comissao) / 100;
        
        SELECT empresa_id, cliente_id INTO empresa_os, cliente_os
        FROM ordens_servico WHERE id = NEW.id;
        
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega,
            empresa_id,
            cliente_id
        ) VALUES (
            NEW.tecnico_id,
            NEW.id,
            NEW.valor_servico,
            tecnico_comissao,
            valor_comissao,
            NOW(),
            COALESCE(empresa_os, NEW.empresa_id),
            COALESCE(cliente_os, NEW.cliente_id)
        );
        
        RAISE NOTICE 'Comissão R$ % calculada para %', valor_comissao, NEW.tecnico_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Testar o sistema
DO $$
DECLARE
    os_teste UUID;
    pedro_tecnico_id UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT tecnico_id INTO pedro_tecnico_id
    FROM usuarios WHERE nome ILIKE '%pedro%' LIMIT 1;
    
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_tecnico_id AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        UPDATE ordens_servico 
        SET status = 'ENTREGUE', valor_servico = 600.00, tipo = 'manutencao'
        WHERE id = os_teste;
        
        PERFORM pg_sleep(1);
        
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        
        RAISE NOTICE 'Teste: % → % comissões', comissoes_antes, comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SISTEMA FUNCIONANDO!';
        ELSE
            RAISE NOTICE '❌ Problema no trigger';
        END IF;
    ELSE
        RAISE NOTICE 'Pedro tecnico_id: %, OS encontrada: %', pedro_tecnico_id, os_teste;
    END IF;
END $$;
