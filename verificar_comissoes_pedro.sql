-- Verificar se Pedro tem comissões registradas
SELECT 
    'COMISSOES PEDRO' as info,
    COUNT(*) as total_comissoes,
    SUM(valor_comissao) as total_valor
FROM comissoes_historico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- Ver detalhes das comissões
SELECT 
    ch.*,
    os.numero_os,
    c.nome as cliente_nome
FROM comissoes_historico ch
LEFT JOIN ordens_servico os ON os.id = ch.ordem_servico_id
LEFT JOIN clientes c ON c.id = os.cliente_id
WHERE ch.tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
ORDER BY ch.data_entrega DESC;

-- Verificar se a função RPC está funcionando
SELECT 'TESTE RPC' as teste, 
       buscar_comissoes_tecnico('2f17436e-f57a-4c17-8efc-672ad7e85530') as resultado;
