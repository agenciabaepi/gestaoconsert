-- =====================================================
-- SCRIPT PARA LIMPAR DADOS DE FORMA SELETIVA
-- MANTENDO AS TABELAS INTACTAS
-- =====================================================

-- ⚠️ ATENÇÃO: Este script permite limpar dados de forma seletiva
-- Descomente apenas as seções que deseja executar

-- =====================================================
-- OPÇÃO 1: LIMPAR APENAS DADOS DE USUÁRIOS (MAIS SEGURO)
-- =====================================================

-- Descomente as linhas abaixo para limpar apenas dados de usuários específicos
-- Substitua 'email_do_usuario@exemplo.com' pelo email do usuário que deseja limpar

/*
-- 1.1. Encontrar usuário específico
-- SELECT id, nome, email FROM usuarios WHERE email = 'email_do_usuario@exemplo.com';

-- 1.2. Excluir lembretes do usuário específico
-- DELETE FROM lembretes WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'email_do_usuario@exemplo.com');

-- 1.3. Excluir movimentações de caixa do usuário específico
-- DELETE FROM movimentacoes_caixa WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'email_do_usuario@exemplo.com');

-- 1.4. Excluir turnos de caixa do usuário específico
-- DELETE FROM turnos_caixa WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'email_do_usuario@exemplo.com');

-- 1.5. Excluir vendas do usuário específico
-- DELETE FROM vendas WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'email_do_usuario@exemplo.com');

-- 1.6. Excluir ordens de serviço do usuário específico
-- DELETE FROM ordens_servico WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'email_do_usuario@exemplo.com');

-- 1.7. Excluir usuário específico
-- DELETE FROM usuarios WHERE email = 'email_do_usuario@exemplo.com';
*/

-- =====================================================
-- OPÇÃO 2: LIMPAR DADOS DE UMA EMPRESA ESPECÍFICA
-- =====================================================

-- Descomente as linhas abaixo para limpar dados de uma empresa específica
-- Substitua 'nome_da_empresa' pelo nome da empresa que deseja limpar

/*
-- 2.1. Encontrar empresa específica
-- SELECT id, nome, cnpj FROM empresas WHERE nome = 'nome_da_empresa';

-- 2.2. Excluir lembretes da empresa
-- DELETE FROM lembretes WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.3. Excluir movimentações de caixa da empresa
-- DELETE FROM movimentacoes_caixa WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.4. Excluir turnos de caixa da empresa
-- DELETE FROM turnos_caixa WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.5. Excluir itens de venda da empresa
-- DELETE FROM itens_venda WHERE venda_id IN (SELECT id FROM vendas WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa'));

-- 2.6. Excluir vendas da empresa
-- DELETE FROM vendas WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.7. Excluir ordens de serviço da empresa
-- DELETE FROM ordens_servico WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.8. Excluir produtos/serviços da empresa
-- DELETE FROM produtos_servicos WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.9. Excluir subcategorias da empresa
-- DELETE FROM subcategorias_produtos WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.10. Excluir categorias da empresa
-- DELETE FROM categorias_produtos WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.11. Excluir grupos de produtos da empresa
-- DELETE FROM grupos_produtos WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.12. Excluir fornecedores da empresa
-- DELETE FROM fornecedores WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.13. Excluir clientes da empresa
-- DELETE FROM clientes WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.14. Excluir assinaturas da empresa
-- DELETE FROM assinaturas WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.15. Excluir usuários da empresa
-- DELETE FROM usuarios WHERE empresa_id IN (SELECT id FROM empresas WHERE nome = 'nome_da_empresa');

-- 2.16. Excluir empresa
-- DELETE FROM empresas WHERE nome = 'nome_da_empresa';
*/

-- =====================================================
-- OPÇÃO 3: LIMPAR TODOS OS DADOS (CUIDADO!)
-- =====================================================

-- ⚠️ ATENÇÃO: Descomente apenas se tiver certeza absoluta!
-- Isso irá excluir TODOS os dados de TODOS os usuários

/*
-- 3.1. Excluir lembretes
DELETE FROM lembretes;

-- 3.2. Excluir movimentações de caixa
DELETE FROM movimentacoes_caixa;

-- 3.3. Excluir turnos de caixa
DELETE FROM turnos_caixa;

-- 3.4. Excluir itens de venda
DELETE FROM itens_venda;

-- 3.5. Excluir vendas
DELETE FROM vendas;

-- 3.6. Excluir ordens de serviço
DELETE FROM ordens_servico;

-- 3.7. Excluir produtos/serviços
DELETE FROM produtos_servicos;

-- 3.8. Excluir subcategorias de produtos
DELETE FROM subcategorias_produtos;

-- 3.9. Excluir categorias de produtos
DELETE FROM categorias_produtos;

-- 3.10. Excluir grupos de produtos
DELETE FROM grupos_produtos;

-- 3.11. Excluir fornecedores
DELETE FROM fornecedores;

-- 3.12. Excluir clientes
DELETE FROM clientes;

-- 3.13. Excluir cobranças
DELETE FROM cobrancas;

-- 3.14. Excluir assinaturas
DELETE FROM assinaturas;

-- 3.15. Excluir usuários
DELETE FROM usuarios;

-- 3.16. Excluir empresas
DELETE FROM empresas;
*/

-- =====================================================
-- VERIFICAÇÃO DE DADOS
-- =====================================================

-- Descomente para verificar quantos registros existem em cada tabela
/*
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
ORDER BY tabela;
*/

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 