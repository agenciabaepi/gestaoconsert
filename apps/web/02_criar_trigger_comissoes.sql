-- =====================================================
-- PASSO 2: CRIAR TRIGGER PARA CÁLCULO AUTOMÁTICO
-- Execute este script APÓS o passo 1
-- =====================================================

-- 1. Função para calcular comissão automaticamente quando OS é entregue
CREATE OR REPLACE FUNCTION calcular_comissao_entrega()
RETURNS TRIGGER AS $$
DECLARE
  tecnico_comissao DECIMAL(5,2);
  tecnico_ativo BOOLEAN;
  config_empresa RECORD;
  valor_base DECIMAL(10,2);
  valor_comissao DECIMAL(10,2);
  tipo_os VARCHAR(20);
  comissao_existente UUID;
BEGIN
  -- Verificar se o status mudou para ENTREGUE
  IF NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE') THEN
    
    -- Verificar se já existe comissão para esta OS
    SELECT id INTO comissao_existente
    FROM comissoes_historico 
    WHERE ordem_servico_id = NEW.id;
    
    -- Se já existe comissão, não calcular novamente
    IF comissao_existente IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Verificar se tem técnico atribuído
    IF NEW.tecnico_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Buscar dados do técnico
    SELECT comissao_percentual, comissao_ativa 
    INTO tecnico_comissao, tecnico_ativo
    FROM usuarios 
    WHERE id = NEW.tecnico_id;
    
    -- Verificar se técnico tem comissão ativa
    IF tecnico_ativo AND tecnico_comissao > 0 THEN
      
      -- Buscar configurações da empresa
      SELECT * INTO config_empresa
      FROM configuracoes_comissao 
      WHERE empresa_id = NEW.empresa_id;
      
      -- Se não tem configuração da empresa, usar valores padrão
      IF config_empresa IS NULL THEN
        config_empresa.comissao_apenas_servico := true;
        config_empresa.comissao_retorno_ativo := false;
      END IF;
      
      -- Determinar o tipo da ordem
      tipo_os := COALESCE(NEW.tipo, 'normal');
      
      -- Verificar se deve calcular comissão para este tipo de ordem
      IF tipo_os = 'normal' OR (tipo_os IN ('retorno', 'garantia') AND config_empresa.comissao_retorno_ativo) THEN
        
        -- Calcular valor base para comissão
        IF config_empresa.comissao_apenas_servico THEN
          valor_base := COALESCE(NEW.valor_servico::DECIMAL, 0);
        ELSE
          valor_base := COALESCE(NEW.valor_faturado::DECIMAL, 0);
        END IF;
        
        -- Calcular comissão
        valor_comissao := valor_base * (tecnico_comissao / 100);
        
        -- Inserir no histórico de comissões apenas se valor > 0
        IF valor_comissao > 0 THEN
          INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            empresa_id,
            valor_servico,
            valor_peca,
            valor_total,
            percentual_comissao,
            valor_comissao,
            tipo_ordem,
            status,
            data_entrega,
            observacoes
          ) VALUES (
            NEW.tecnico_id,
            NEW.id,
            NEW.empresa_id,
            COALESCE(NEW.valor_servico::DECIMAL, 0),
            COALESCE(NEW.valor_peca::DECIMAL, 0),
            COALESCE(NEW.valor_faturado::DECIMAL, 0),
            tecnico_comissao,
            valor_comissao,
            tipo_os,
            'pendente',
            NOW(),
            CASE 
              WHEN tipo_os = 'normal' THEN 'Comissão calculada automaticamente'
              WHEN tipo_os IN ('retorno', 'garantia') THEN 'Comissão de retorno/garantia'
              ELSE 'Comissão calculada'
            END
          );
        END IF;
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para calcular comissão automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON ordens_servico;
CREATE TRIGGER trigger_calcular_comissao
  AFTER UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION calcular_comissao_entrega();

-- 3. Testar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calcular_comissao';

-- 4. Mostrar funções criadas
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calcular_comissao_entrega';

SELECT 'Trigger criado com sucesso!' as status;
