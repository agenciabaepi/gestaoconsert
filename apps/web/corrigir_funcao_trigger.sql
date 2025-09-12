-- =====================================================
-- CORRIGIR FUNÇÃO TRIGGER
-- =====================================================

-- Corrigir função com RAISE NOTICE mais simples
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    tecnico_comissao DECIMAL(5,2);
    tecnico_ativo BOOLEAN;
    valor_comissao DECIMAL(10,2);
    empresa_os UUID;
    cliente_os UUID;
    usuario_nome TEXT;
BEGIN
    RAISE NOTICE 'TRIGGER INICIADO - OS: %, Status: %', NEW.id, NEW.status;
    
    -- Verificar se é mudança para ENTREGUE
    IF NEW.status = 'ENTREGUE' THEN
        RAISE NOTICE 'Status é ENTREGUE';
        
        -- Verificar se mudou para ENTREGUE
        IF OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'ENTREGUE' THEN
            RAISE NOTICE 'Mudança para ENTREGUE detectada';
            
            -- Verificar se tem técnico válido
            IF NEW.tecnico_id IS NULL THEN
                RAISE NOTICE 'ABORTAR: OS sem técnico';
                RETURN NEW;
            END IF;
            
            RAISE NOTICE 'Tecnico_id: %', NEW.tecnico_id;
            
            -- Buscar técnico por tecnico_id (UUID)
            SELECT u.nome, u.comissao_percentual, u.comissao_ativa
            INTO usuario_nome, tecnico_comissao, tecnico_ativo
            FROM usuarios u
            WHERE u.tecnico_id = NEW.tecnico_id;
            
            IF NOT FOUND THEN
                RAISE NOTICE 'ABORTAR: Técnico não encontrado';
                RETURN NEW;
            END IF;
            
            RAISE NOTICE 'Técnico: %, Comissão: %', usuario_nome, tecnico_comissao;
            
            -- Verificar se técnico tem comissão ativa
            IF NOT tecnico_ativo OR tecnico_comissao IS NULL OR tecnico_comissao = 0 THEN
                RAISE NOTICE 'ABORTAR: Comissão inativa ou zerada';
                RETURN NEW;
            END IF;
            
            -- Verificar se não é retorno (garantia)
            IF NEW.tipo = 'retorno' OR NEW.tipo = 'garantia' THEN
                RAISE NOTICE 'ABORTAR: É garantia/retorno';
                RETURN NEW;
            END IF;
            
            -- Verificar valor do serviço
            IF NEW.valor_servico IS NULL OR NEW.valor_servico = 0 THEN
                RAISE NOTICE 'ABORTAR: Sem valor de serviço';
                RETURN NEW;
            END IF;
            
            -- Calcular comissão
            valor_comissao := (NEW.valor_servico * tecnico_comissao) / 100;
            RAISE NOTICE 'Comissão calculada: %', valor_comissao;
            
            -- Buscar empresa_id e cliente_id
            SELECT empresa_id, cliente_id INTO empresa_os, cliente_os
            FROM ordens_servico WHERE id = NEW.id;
            
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
                
                RAISE NOTICE 'SUCESSO: Comissão inserida!';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'ERRO ao inserir: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Status já era ENTREGUE';
        END IF;
    ELSE
        RAISE NOTICE 'Status não é ENTREGUE';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION calcular_comissao_entrega();

-- Verificar se Pedro tem dados corretos
SELECT 
  'PEDRO DADOS' as info,
  nome,
  tecnico_id,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE nome ILIKE '%pedro%';

-- Teste direto
DO $$
DECLARE
    os_teste UUID;
    pedro_tecnico_id UUID;
BEGIN
    -- Buscar Pedro
    SELECT tecnico_id INTO pedro_tecnico_id
    FROM usuarios 
    WHERE nome ILIKE '%pedro%' 
    LIMIT 1;
    
    -- Buscar OS do Pedro
    SELECT id INTO os_teste
    FROM ordens_servico 
    WHERE tecnico_id = pedro_tecnico_id 
      AND status != 'ENTREGUE'
    LIMIT 1;
    
    IF os_teste IS NOT NULL THEN
        RAISE NOTICE 'TESTE: Atualizando OS %', os_teste;
        
        -- Atualizar para ENTREGUE
        UPDATE ordens_servico 
        SET 
          valor_servico = 900.00,
          tipo = 'manutencao',
          status = 'ENTREGUE'
        WHERE id = os_teste;
        
        RAISE NOTICE 'Update executado - verificar logs';
    ELSE
        RAISE NOTICE 'Nenhuma OS encontrada';
    END IF;
END $$;
