-- =====================================================
-- CRIAR FUNÇÃO RPC PARA BUSCAR COMISSÕES
-- =====================================================

-- Criar função que bypassa RLS
CREATE OR REPLACE FUNCTION buscar_comissoes_tecnico(tecnico_auth_id TEXT)
RETURNS TABLE (
  id UUID,
  tecnico_id UUID,
  valor_comissao NUMERIC,
  data_entrega TIMESTAMP WITH TIME ZONE,
  status TEXT,
  valor_servico NUMERIC
) 
SECURITY DEFINER -- Executa com privilégios do owner (admin)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.tecnico_id,
    ch.valor_comissao,
    ch.data_entrega,
    ch.status,
    ch.valor_servico
  FROM comissoes_historico ch
  WHERE ch.tecnico_id::text = ANY(ARRAY[
    '1102c335-5991-43f2-858e-ed130d69edc1', -- ID específico da comissão
    'c7f16254-fce3-49cd-9956-2189b0de53c7',  -- Outro ID
    '2f17436e-f57a-4c17-8efc-672ad7e85530',  -- ID que apareceu antes
    tecnico_auth_id                          -- ID passado como parâmetro
  ])
  ORDER BY ch.data_entrega DESC;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT 'TESTE FUNCAO' as teste, COUNT(*) as total, SUM(valor_comissao) as total_valor
FROM buscar_comissoes_tecnico('2f17436e-f57a-4c17-8efc-672ad7e85530');
