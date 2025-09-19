-- =====================================================
-- CORRIGIR TIPOS TECNICO_ID
-- =====================================================

-- 1. Verificar tipos das colunas
SELECT 
  'TIPOS DAS COLUNAS' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE (table_name = 'ordens_servico' AND column_name = 'tecnico_id')
   OR (table_name = 'usuarios' AND column_name = 'auth_user_id')
   OR (table_name = 'comissoes_historico' AND column_name = 'tecnico_id')
ORDER BY table_name, column_name;

-- 2. Verificar dados do Pedro
SELECT 
  'DADOS DO PEDRO' as info,
  id,
  nome,
  auth_user_id,
  tecnico_id,
  pg_typeof(auth_user_id) as tipo_auth_user_id,
  pg_typeof(tecnico_id) as tipo_tecnico_id
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- 3. Ver OSs do Pedro
SELECT 
  'OSs COM PEDRO' as info,
  id,
  numero_os,
  tecnico_id,
  pg_typeof(tecnico_id) as tipo_tecnico_id
FROM ordens_servico 
WHERE tecnico_id::text = (SELECT auth_user_id FROM usuarios WHERE nome ILIKE '%pedro%' LIMIT 1)
LIMIT 3;

-- 4. SOLUÇÃO: Converter auth_user_id para UUID na busca
DO $$
DECLARE
    os_teste UUID;
    pedro_auth_user_id TEXT;
    pedro_auth_user_uuid UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Buscar auth_user_id do Pedro como TEXT
    SELECT auth_user_id INTO pedro_auth_user_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Converter para UUID
    pedro_auth_user_uuid := pedro_auth_user_id::UUID;
    
    RAISE NOTICE 'Pedro auth_user_id (text): %', pedro_auth_user_id;
    RAISE NOTICE 'Pedro auth_user_id (uuid): %', pedro_auth_user_uuid;
    
    -- Buscar uma OS do Pedro usando UUID
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_auth_user_uuid
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando: OS % do Pedro', os_teste;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Garantir valor e marcar como ENTREGUE
        UPDATE ordens_servico 
        SET 
          status = 'ENTREGUE',
          valor_servico = 400.00,
          tipo = 'manutencao'
        WHERE id = os_teste;
        
        -- Aguardar trigger
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SISTEMA FUNCIONANDO!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS encontrada para Pedro';
        
        -- Mostrar quais tecnico_id existem
        SELECT string_agg(DISTINCT tecnico_id::text, ', ') INTO pedro_auth_user_id
        FROM ordens_servico 
        WHERE tecnico_id IS NOT NULL
        LIMIT 10;
        
        RAISE NOTICE 'tecnico_ids existentes: %', pedro_auth_user_id;
    END IF;
END $$;

-- 5. Corrigir trigger para lidar com conversão de tipos
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    empresa_os UUID;
    cliente_os UUID;
    usuario_id UUID;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Trigger disparado para OS %, status: %, tecnico_id: %', NEW.id, NEW.status, NEW.tecnico_id;
    
    -- Verificar se é mudança para ENTREGUE
    IF NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE') THEN
        
        -- Verificar se tem técnico válido
        IF NEW.tecnico_id IS NULL THEN
            RAISE NOTICE 'OS % sem técnico atribuído', NEW.id;
            RETURN NEW;
        END IF;
        
        -- NEW.tecnico_id é UUID, converter para text para comparar com auth_user_id
        SELECT id, comissao_percentual, comissao_ativa
        INTO usuario_id, tecnico_comissao, tecnico_ativo
        FROM usuarios 
        WHERE auth_user_id = NEW.tecnico_id::text;
        
        IF NOT FOUND THEN
            RAISE NOTICE 'Técnico com auth_user_id % não encontrado', NEW.tecnico_id;
            RETURN NEW;
        END IF;
        
        -- Verificar se técnico tem comissão ativa
        IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
            RAISE NOTICE 'Técnico % sem comissão ativa', usuario_id;
            RETURN NEW;
        END IF;
        
        -- Verificar se não é retorno (garantia)
        IF NEW.tipo = 'retorno' OR NEW.tipo = 'garantia' THEN
            RAISE NOTICE 'OS % é retorno/garantia - sem comissão', NEW.id;
            RETURN NEW;
        END IF;
        
        -- Calcular comissão (apenas sobre valor do serviço)
        IF NEW.valor_servico IS NULL OR NEW.valor_servico = 0 THEN
            RAISE NOTICE 'OS % sem valor de serviço', NEW.id;
            RETURN NEW;
        END IF;
        
        valor_comissao := (NEW.valor_servico * tecnico_comissao) / 100;
        
        -- Buscar empresa_id e cliente_id
        SELECT empresa_id, cliente_id INTO empresa_os, cliente_os
        FROM ordens_servico
        WHERE id = NEW.id;
        
        -- Inserir na tabela de comissões usando NEW.tecnico_id (UUID)
        BEGIN
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
                NEW.tecnico_id, -- UUID
                NEW.id,
                NEW.valor_servico,
                tecnico_comissao,
                valor_comissao,
                NOW(),
                COALESCE(empresa_os, NEW.empresa_id),
                COALESCE(cliente_os, NEW.cliente_id)
            );
            
            RAISE NOTICE 'Comissão calculada: R$ % para tecnico_id %', valor_comissao, NEW.tecnico_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao inserir comissão: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
