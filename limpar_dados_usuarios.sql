-- =====================================================
-- SCRIPT PARA LIMPAR DADOS DE USUÁRIOS E RELACIONADOS
-- MANTENDO AS TABELAS INTACTAS
-- =====================================================

-- ⚠️ ATENÇÃO: Este script irá excluir TODOS os dados dos usuários
-- e dados relacionados. Execute apenas se tiver certeza!

-- =====================================================
-- 1. EXCLUIR DADOS RELACIONADOS AOS USUÁRIOS (ORDEM CORRETA)
-- =====================================================

-- 1.1. Excluir lembretes (relacionados aos usuários)
DELETE FROM lembretes;

-- 1.2. Excluir movimentações de caixa (relacionadas aos usuários)
DELETE FROM movimentacoes_caixa;

-- 1.3. Excluir turnos de caixa (relacionados aos usuários)
DELETE FROM turnos_caixa;

-- 1.4. Excluir itens de venda (relacionados às vendas)
DELETE FROM itens_venda;

-- 1.5. Excluir vendas (relacionadas aos usuários)
DELETE FROM vendas;

-- 1.6. Excluir ordens de serviço (relacionadas aos usuários)
DELETE FROM ordens_servico;

-- 1.7. Excluir produtos/serviços (relacionados às empresas)
DELETE FROM produtos_servicos;

-- 1.8. Excluir subcategorias de produtos (relacionadas às empresas)
DELETE FROM subcategorias_produtos;

-- 1.9. Excluir categorias de produtos (relacionadas às empresas)
DELETE FROM categorias_produtos;

-- 1.10. Excluir grupos de produtos (relacionados às empresas)
DELETE FROM grupos_produtos;

-- 1.11. Excluir fornecedores (relacionados às empresas)
DELETE FROM fornecedores;

-- 1.12. Excluir clientes (relacionados às empresas)
DELETE FROM clientes;

-- 1.13. Excluir cobranças (relacionadas às assinaturas)
DELETE FROM cobrancas;

-- 1.14. Excluir assinaturas (relacionadas às empresas)
DELETE FROM assinaturas;

-- =====================================================
-- 2. EXCLUIR USUÁRIOS E EMPRESAS
-- =====================================================

-- 2.1. Excluir usuários (isso também excluirá empresas devido ao CASCADE)
DELETE FROM usuarios;

-- 2.2. Excluir empresas restantes (caso não tenham sido excluídas pelo CASCADE)
DELETE FROM empresas;

-- =====================================================
-- 3. LIMPAR DADOS DE AUTENTICAÇÃO (OPCIONAL)
-- =====================================================

-- ⚠️ ATENÇÃO: Descomente as linhas abaixo apenas se quiser limpar também os dados de autenticação
-- Isso irá excluir TODOS os usuários do sistema de autenticação do Supabase

-- DELETE FROM auth.users;

-- =====================================================
-- 4. VERIFICAR LIMPEZA
-- =====================================================

-- Verificar se as tabelas estão vazias
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
SELECT 'cobrancas' as tabela, COUNT(*) as total FROM cobrancas;

-- =====================================================
-- 5. MANTER PLANOS (DADOS DO SISTEMA)
-- =====================================================

-- Os planos são mantidos pois são dados do sistema, não dos usuários
-- SELECT 'planos' as tabela, COUNT(*) as total FROM planos;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 