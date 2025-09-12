-- =====================================================
-- CORRIGIR DATA DA O.S. DE TESTE PARA 04/09/2025
-- =====================================================

-- Atualizar a O.S. de teste para ter prazo em 04/09/2025
UPDATE ordens_servico 
SET prazo_entrega = '2025-09-04T10:00:00+00:00'
WHERE numero_os = '1' 
AND empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac';

-- Verificar se foi atualizada
SELECT 
  id,
  numero_os,
  prazo_entrega,
  status,
  empresa_id
FROM ordens_servico 
WHERE numero_os = '1' 
AND empresa_id = '3a3958e9-9ac7-4f04-9d0b-d537df70a4ac';
