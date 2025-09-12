-- =====================================================
-- CORRIGIR SISTEMA TECNICO_ID FINAL
-- =====================================================

-- 1. Verificar situação atual
SELECT 
  'SITUAÇÃO ATUAL' as info,
  'OSs usam tecnico_id (auth_user_id)' as os_sistema,
  'Comissões esperam tecnico_id (usuarios.id)' as comissao_sistema,
  'INCONSISTÊNCIA!' as problema;

-- 2. OPÇÃO A: Manter OSs com auth_user_id e ajustar comissões
-- Atualizar trigger para usar auth_user_id nas comissões também

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
        
        -- NEW.tecnico_id agora é auth_user_id, então buscar o usuário por auth_user_id
        SELECT id, comissao_percentual, comissao_ativa
        INTO usuario_id, tecnico_comissao, tecnico_ativo
        FROM usuarios 
        WHERE auth_user_id = NEW.tecnico_id;
        
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
        
        -- Inserir na tabela de comissões usando NEW.tecnico_id (auth_user_id)
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
                NEW.tecnico_id, -- Usar auth_user_id diretamente
                NEW.id,
                NEW.valor_servico,
                tecnico_comissao,
                valor_comissao,
                NOW(),
                COALESCE(empresa_os, NEW.empresa_id),
                COALESCE(cliente_os, NEW.cliente_id)
            );
            
            RAISE NOTICE 'Comissão calculada: R$ % para auth_user_id %', valor_comissao, NEW.tecnico_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao inserir comissão: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Limpar comissões antigas que usam usuarios.id
DELETE FROM comissoes_historico WHERE tecnico_id NOT IN (
    SELECT auth_user_id FROM usuarios WHERE auth_user_id IS NOT NULL
);

-- 4. Preencher Pedro com tecnico_id correto
UPDATE usuarios 
SET tecnico_id = auth_user_id 
WHERE nome ILIKE '%pedro%' AND tecnico_id IS NULL;

-- 5. Testar o sistema corrigido
DO $$
DECLARE
    os_teste UUID;
    pedro_auth_user_id TEXT;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Buscar auth_user_id do Pedro
    SELECT auth_user_id INTO pedro_auth_user_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Buscar uma OS do Pedro
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_auth_user_id
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL AND pedro_auth_user_id IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando: OS % do Pedro (auth_user_id: %)', os_teste, pedro_auth_user_id;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Garantir valor e marcar como ENTREGUE
        UPDATE ordens_servico 
        SET 
          status = 'ENTREGUE',
          valor_servico = 300.00,
          tipo = 'manutencao'
        WHERE id = os_teste;
        
        -- Aguardar trigger
        PERFORM pg_sleep(2);
        
        -- Contar comissões depois
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '🎉 SISTEMA FUNCIONANDO! Usando auth_user_id';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE 'Pedro auth_user_id: %, OS encontrada: %', pedro_auth_user_id, os_teste;
    END IF;
END $$;

-- 6. Verificar resultado final
SELECT 
  'VERIFICAÇÃO FINAL' as resultado,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT auth_user_id FROM usuarios WHERE nome ILIKE '%pedro%' LIMIT 1) as pedro_auth_user_id,
  (SELECT COUNT(*) FROM ordens_servico WHERE tecnico_id = (SELECT auth_user_id FROM usuarios WHERE nome ILIKE '%pedro%' LIMIT 1)) as os_pedro;
