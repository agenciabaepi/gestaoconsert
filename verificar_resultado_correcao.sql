-- =====================================================
-- VERIFICAR RESULTADO DA CORREÇÃO
-- =====================================================

-- 1. Ver se as comissões foram inseridas
SELECT 'RESULTADO FINAL' as momento, COUNT(*) as total_comissoes FROM comissoes_historico;

-- 2. Ver o erro completo nos logs
SELECT 
  'ERRO COMPLETO' as tipo,
  mensagem,
  timestamp
FROM teste_trigger_log 
WHERE mensagem LIKE '%ERRO%'
ORDER BY timestamp DESC
LIMIT 5;

-- 3. Verificar estrutura atual da tabela após correção
SELECT 
  'ESTRUTURA POS CORRECAO' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'comissoes_historico'
ORDER BY ordinal_position;

-- 4. Verificar dados da OS 921 para debug
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

-- 5. Tentar inserção manual simples para testar
DO $$
DECLARE
    os_data RECORD;
BEGIN
    SELECT * INTO os_data FROM ordens_servico WHERE numero_os = '921';
    
    BEGIN
        INSERT INTO comissoes_historico (
            tecnico_id,
            ordem_servico_id,
            valor_servico,
            percentual_comissao,
            valor_comissao,
            data_entrega
        ) VALUES (
            os_data.tecnico_id,
            os_data.id,
            100.00,
            10.00,
            10.00,
            NOW()
        );
        
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('MANUAL SIMPLES: Sucesso!');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO teste_trigger_log (mensagem) 
        VALUES ('MANUAL SIMPLES: ERRO - ' || SQLERRM);
    END;
END $$;

-- 6. Verificar se inserção manual funcionou
SELECT 'TESTE MANUAL' as momento, COUNT(*) as total FROM comissoes_historico;
