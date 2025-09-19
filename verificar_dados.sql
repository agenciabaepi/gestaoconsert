-- =====================================================
-- SCRIPT PARA VERIFICAR DADOS NO BANCO
-- =====================================================

-- Este script mostra quantos registros existem em cada tabela
-- Execute antes e depois de limpar os dados para verificar

-- =====================================================
-- VERIFICAÇÃO GERAL DE DADOS
-- =====================================================

SELECT 'empresas' as tabela, COUNT(*) as total FROM empresas
UNION ALL
SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'clientes' as tabela, COUNT(*) as total FROM clientes
UNION ALL
SELECT 'fornecedores' as tabela, COUNT(*) as total FROM fornecedores
UNION ALL
SELECT 'produtos_servicos' as tabela, COUNT(*) as total FROM produtos_servicos
UNION ALL
SELECT 'grupos_produtos' as tabela, COUNT(*) as total FROM grupos_produtos
UNION ALL
SELECT 'categorias_produtos' as tabela, COUNT(*) as total FROM categorias_produtos
UNION ALL
SELECT 'subcategorias_produtos' as tabela, COUNT(*) as total FROM subcategorias_produtos
UNION ALL
SELECT 'turnos_caixa' as tabela, COUNT(*) as total FROM turnos_caixa
UNION ALL
SELECT 'movimentacoes_caixa' as tabela, COUNT(*) as total FROM movimentacoes_caixa
UNION ALL
SELECT 'vendas' as tabela, COUNT(*) as total FROM vendas
UNION ALL
SELECT 'itens_venda' as tabela, COUNT(*) as total FROM itens_venda
UNION ALL
SELECT 'ordens_servico' as tabela, COUNT(*) as total FROM ordens_servico
UNION ALL
SELECT 'lembretes' as tabela, COUNT(*) as total FROM lembretes
UNION ALL
SELECT 'assinaturas' as tabela, COUNT(*) as total FROM assinaturas
UNION ALL
SELECT 'cobrancas' as tabela, COUNT(*) as total FROM cobrancas
UNION ALL
SELECT 'planos' as tabela, COUNT(*) as total FROM planos
ORDER BY tabela;

-- =====================================================
-- VERIFICAÇÃO DETALHADA DE EMPRESAS
-- =====================================================

-- Listar todas as empresas
SELECT 'LISTA DE EMPRESAS:' as info;
SELECT id, nome, cnpj, email, created_at FROM empresas ORDER BY created_at DESC;

-- =====================================================
-- VERIFICAÇÃO DETALHADA DE USUÁRIOS
-- =====================================================

-- Listar todos os usuários
SELECT 'LISTA DE USUÁRIOS:' as info;
SELECT id, nome, email, nivel, empresa_id, created_at FROM usuarios ORDER BY created_at DESC;

-- =====================================================
-- VERIFICAÇÃO DE RELACIONAMENTOS
-- =====================================================

-- Verificar usuários por empresa
SELECT 'USUÁRIOS POR EMPRESA:' as info;
SELECT 
    e.nome as empresa,
    COUNT(u.id) as total_usuarios
FROM empresas e
LEFT JOIN usuarios u ON e.id = u.empresa_id
GROUP BY e.id, e.nome
ORDER BY total_usuarios DESC;

-- Verificar clientes por empresa
SELECT 'CLIENTES POR EMPRESA:' as info;
SELECT 
    e.nome as empresa,
    COUNT(c.id) as total_clientes
FROM empresas e
LEFT JOIN clientes c ON e.id = c.empresa_id
GROUP BY e.id, e.nome
ORDER BY total_clientes DESC;

-- Verificar produtos por empresa
SELECT 'PRODUTOS POR EMPRESA:' as info;
SELECT 
    e.nome as empresa,
    COUNT(p.id) as total_produtos
FROM empresas e
LEFT JOIN produtos_servicos p ON e.id = p.empresa_id
GROUP BY e.id, e.nome
ORDER BY total_produtos DESC;

-- =====================================================
-- VERIFICAÇÃO DE ASSINATURAS
-- =====================================================

-- Verificar assinaturas ativas
SELECT 'ASSINATURAS ATIVAS:' as info;
SELECT 
    e.nome as empresa,
    a.status,
    a.data_inicio,
    a.data_fim,
    p.nome as plano
FROM assinaturas a
JOIN empresas e ON a.empresa_id = e.id
JOIN planos p ON a.plano_id = p.id
WHERE a.status IN ('active', 'trial')
ORDER BY a.created_at DESC;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 