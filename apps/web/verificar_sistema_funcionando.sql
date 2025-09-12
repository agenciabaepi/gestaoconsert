-- =====================================================
-- VERIFICAR SISTEMA FUNCIONANDO
-- =====================================================

-- 1. Ver todas as comissões criadas
SELECT 
  'COMISSÕES CRIADAS' as resultado,
  ch.id,
  ch.tecnico_id,
  u.nome as tecnico_nome,
  ch.valor_servico,
  ch.percentual_comissao,
  ch.valor_comissao,
  ch.ordem_servico_id,
  os.numero_os,
  ch.data_entrega,
  ch.created_at
FROM comissoes_historico ch
JOIN usuarios u ON u.tecnico_id = ch.tecnico_id
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
ORDER BY ch.created_at DESC;

-- 2. Ver status atual da OS 917
SELECT 
  'OS 917 FINAL' as info,
  id,
  numero_os,
  status,
  valor_servico,
  tipo,
  tecnico_id
FROM ordens_servico 
WHERE numero_os = '917';

-- 3. Configurar RLS corretamente para produção
-- Criar política que permite inserção para usuários autenticados
CREATE POLICY "Permitir inserção de comissões" 
ON comissoes_historico 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Reabilitar RLS com política correta
ALTER TABLE comissoes_historico ENABLE ROW LEVEL SECURITY;

-- 4. Teste final com RLS habilitado
DO $$
DECLARE
    os_id_917 UUID;
    comissoes_antes INTEGER;
    comissoes_depois INTEGER;
BEGIN
    SELECT id INTO os_id_917 FROM ordens_servico WHERE numero_os = '917';
    SELECT COUNT(*) INTO comissoes_antes FROM comissoes_historico;
    
    RAISE NOTICE 'TESTE COM RLS: antes = %', comissoes_antes;
    
    -- Mudança de status para disparar trigger
    UPDATE ordens_servico 
    SET status = 'EM_ANALISE'
    WHERE id = os_id_917;
    
    UPDATE ordens_servico 
    SET 
      status = 'ENTREGUE',
      valor_servico = 2500.00,
      tipo = 'manutencao'
    WHERE id = os_id_917;
    
    PERFORM pg_sleep(1);
    
    SELECT COUNT(*) INTO comissoes_depois FROM comissoes_historico;
    RAISE NOTICE 'TESTE COM RLS: depois = %', comissoes_depois;
    
    IF comissoes_depois > comissoes_antes THEN
        RAISE NOTICE '🎉 SISTEMA FUNCIONA COM RLS!';
    ELSE
        RAISE NOTICE '⚠️ RLS bloqueando - política precisa ajuste';
    END IF;
END $$;

-- 5. Resumo final
SELECT 
  'RESUMO FINAL' as info,
  (SELECT COUNT(*) FROM comissoes_historico) as total_comissoes,
  (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ENTREGUE') as total_os_entregues,
  (SELECT COUNT(*) FROM usuarios WHERE comissao_ativa = true) as tecnicos_ativos;
