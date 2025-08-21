-- =====================================================
-- VERIFICAR LOGS DA COMISSÃO
-- =====================================================

-- 1. Ver todos os logs de comissão
SELECT 
  'LOGS COMISSAO' as tipo,
  mensagem,
  timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%COMISSAO%'
ORDER BY timestamp;

-- 2. Ver TODOS os logs (pode ter outros problemas)
SELECT 
  'TODOS OS LOGS' as tipo,
  mensagem,
  timestamp
FROM teste_trigger_log 
ORDER BY timestamp DESC
LIMIT 20;

-- 3. Verificar dados da OS 921
SELECT 
  'DADOS OS 921' as info,
  id,
  numero_os,
  status,
  tecnico_id,
  valor_servico,
  empresa_id,
  cliente_id
FROM ordens_servico 
WHERE numero_os = '921';

-- 4. Verificar se trigger de comissão está ativo
SELECT 
  'TRIGGER COMISSAO STATUS' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'ordens_servico'
AND trigger_name = 'trigger_calcular_comissao';

-- 5. Verificar estrutura da tabela comissoes_historico
SELECT 
  'ESTRUTURA COMISSOES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 6. Verificar se conseguimos inserir diretamente
DO $$
DECLARE
    os_data RECORD;
BEGIN
    -- Pegar dados da OS 921
    SELECT * INTO os_data FROM ordens_servico WHERE numero_os = '921';
    
    -- Tentar inserir diretamente
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
            os_data.tecnico_id,
            os_data.id,
            COALESCE(os_data.valor_servico, 100),
            10.00,
            COALESCE(os_data.valor_servico, 100) * 0.10,
            NOW(),
            os_data.empresa_id,
            os_data.cliente_id
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT DIRETO: Funcionou!');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('INSERT DIRETO: ERRO - ' || SQLERRM);
    END;
END $$;

-- 7. Verificar resultado do insert direto
SELECT 'POS INSERT DIRETO' as momento, COUNT(*) as total FROM comissoes_historico;
