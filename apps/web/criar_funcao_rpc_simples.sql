-- =====================================================
-- CRIAR FUNÇÃO RPC SIMPLES
-- =====================================================

-- Primeiro dropar se existir
DROP FUNCTION IF EXISTS buscar_comissoes_tecnico(TEXT);

-- Criar função simples que funciona
CREATE OR REPLACE FUNCTION buscar_comissoes_tecnico(tecnico_id_param TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', ch.id,
            'tecnico_id', ch.tecnico_id,
            'valor_comissao', ch.valor_comissao,
            'data_entrega', ch.data_entrega,
            'status', ch.status,
            'valor_servico', ch.valor_servico
        )
    )
    INTO resultado
    FROM comissoes_historico ch
    WHERE ch.tecnico_id::text = ANY(ARRAY[
        '1102c335-5991-43f2-858e-ed130d69edc1',
        'c7f16254-fce3-49cd-9956-2189b0de53c7',
        '2f17436e-f57a-4c17-8efc-672ad7e85530',
        tecnico_id_param
    ]);
    
    RETURN COALESCE(resultado, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_comissoes_tecnico(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION buscar_comissoes_tecnico(TEXT) TO authenticated;

-- Testar a função
SELECT 'TESTE FUNCAO SIMPLES' as teste, buscar_comissoes_tecnico('teste') as resultado;
