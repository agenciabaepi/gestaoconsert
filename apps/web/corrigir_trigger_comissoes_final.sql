-- =====================================================
-- CORRIGIR TRIGGER DE COMISSÕES - VERSÃO FINAL
-- =====================================================

-- 1. Verificar OSs problemáticas
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  os.id,
  os.tecnico_id,
  os.status,
  CASE 
    WHEN u.id IS NULL THEN 'ID não existe na tabela usuarios'
    ELSE 'OK'
  END as status_tecnico
FROM ordens_servico os
LEFT JOIN usuarios u ON os.tecnico_id = u.id
WHERE os.tecnico_id IS NOT NULL
  AND u.id IS NULL
LIMIT 10;

-- 2. Verificar e corrigir a função de comissão
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    empresa_os UUID;
    cliente_os UUID;
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
        
        -- Verificar se o técnico existe na tabela usuarios
        SELECT comissao_percentual, comissao_ativa
        INTO tecnico_comissao, tecnico_ativo
        FROM usuarios 
        WHERE id = NEW.tecnico_id;
        
        IF NOT FOUND THEN
            RAISE NOTICE 'Técnico % não encontrado na tabela usuarios', NEW.tecnico_id;
            RETURN NEW;
        END IF;
        
        -- Verificar se técnico tem comissão ativa
        IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
            RAISE NOTICE 'Técnico % sem comissão ativa ou percentual zerado', NEW.tecnico_id;
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
        
        -- Inserir na tabela de comissões
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
                NEW.tecnico_id,
                NEW.id,
                NEW.valor_servico,
                tecnico_comissao,
                valor_comissao,
                NOW(),
                COALESCE(empresa_os, NEW.empresa_id),
                COALESCE(cliente_os, NEW.cliente_id)
            );
            
            RAISE NOTICE 'Comissão calculada: R$ % para técnico %', valor_comissao, NEW.tecnico_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao inserir comissão: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- 4. Testar com uma OS real
DO $$
DECLARE
    os_teste UUID;
    tecnico_teste UUID;
    tecnico_nome TEXT;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    -- Buscar uma OS que possa ser testada
    SELECT os.id, os.tecnico_id, u.nome
    INTO os_teste, tecnico_teste, tecnico_nome
    FROM ordens_servico os
    JOIN usuarios u ON os.tecnico_id = u.id
    WHERE os.status != 'ENTREGUE' 
      AND os.valor_servico > 0
      AND u.comissao_ativa = true
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        -- Contar comissões antes
        SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
        
        RAISE NOTICE 'Testando trigger com OS % do técnico %', os_teste, tecnico_nome;
        RAISE NOTICE 'Comissões antes: %', comissoes_antes;
        
        -- Marcar como ENTREGUE
        UPDATE ordens_servico 
        SET status = 'ENTREGUE'
        WHERE id = os_teste;
        
        -- Verificar resultado
        SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
        RAISE NOTICE 'Comissões depois: %', comissoes_depois;
        
        IF comissoes_depois > comissoes_antes THEN
            RAISE NOTICE '✅ SUCESSO! Trigger funcionando!';
        ELSE
            RAISE NOTICE '❌ Trigger não disparou';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma OS adequada encontrada para teste';
    END IF;
END $$;

-- 5. Mostrar resultado
SELECT 
  'VERIFICAÇÃO FINAL' as resultado,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as total_os_entregues,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos;
