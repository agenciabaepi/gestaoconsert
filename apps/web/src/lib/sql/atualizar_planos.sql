-- =====================================================
-- ATUALIZAÇÃO DOS PLANOS CONFORME PÁGINA DE CADASTRO
-- =====================================================

-- Primeiro, vamos limpar os planos existentes
DELETE FROM planos WHERE nome IN ('Trial', 'Básico', 'Profissional', 'Empresarial');

-- Inserir os novos planos conforme a página de cadastro
INSERT INTO planos (
    nome, 
    descricao, 
    preco, 
    periodo,
    limite_usuarios, 
    limite_produtos, 
    limite_clientes, 
    limite_fornecedores, 
    recursos_disponiveis
) VALUES
-- Plano Trial (gratuito)
(
    'Trial', 
    'Período de teste gratuito', 
    0.00, 
    'monthly',
    1, 
    50, 
    20, 
    10, 
    '{"relatorios": false, "api": false, "suporte": false, "financeiro": false, "comissao": false, "nfe": false, "estoque": false, "permissoes": false, "kanban": false, "app": false, "whatsapp": false, "dashboard": false, "relatorios_personalizados": false}'
),

-- Plano Básico
(
    'Básico', 
    'Sistema completo para começar', 
    129.90, 
    'monthly',
    1, 
    200, 
    100, 
    50, 
    '{"relatorios": true, "api": false, "suporte": false, "financeiro": false, "comissao": false, "nfe": false, "estoque": false, "permissoes": false, "kanban": false, "app": false, "whatsapp": false, "dashboard": false, "relatorios_personalizados": false}'
),

-- Plano Pro
(
    'Pro', 
    'Plano completo para equipes', 
    189.90, 
    'monthly',
    5, 
    1000, 
    500, 
    200, 
    '{"relatorios": true, "api": true, "suporte": true, "financeiro": true, "comissao": true, "nfe": true, "estoque": true, "permissoes": true, "kanban": false, "app": false, "whatsapp": false, "dashboard": false, "relatorios_personalizados": false}'
),

-- Plano Avançado
(
    'Avançado', 
    'Experiência completa + automações', 
    279.90, 
    'monthly',
    10, 
    5000, 
    2000, 
    500, 
    '{"relatorios": true, "api": true, "suporte": true, "financeiro": true, "comissao": true, "nfe": true, "estoque": true, "permissoes": true, "kanban": true, "app": true, "whatsapp": true, "dashboard": true, "relatorios_personalizados": true}'
);

-- =====================================================
-- COMENTÁRIOS SOBRE OS RECURSOS
-- =====================================================

/*
RECURSOS POR PLANO:

TRIAL (Gratuito - 15 dias):
- 1 usuário, 1 técnico
- Sistema de OS básico
- Cadastro de clientes
- Cadastro de produtos/serviços
- Relatórios simples

BÁSICO (R$ 129,90/mês):
- 1 usuário, 1 técnico
- Sistema de OS completo
- Cadastro de clientes
- Cadastro de produtos/serviços
- Relatórios simples de atendimento
- Segurança de dados na nuvem

PRO (R$ 189,90/mês):
- 5 usuários, 5 técnicos
- Controle financeiro
- Comissão por técnico
- Emissão de nota fiscal
- Controle de permissões
- Controle de estoque detalhado
- Gestão de equipe por permissões

AVANÇADO (R$ 279,90/mês):
- 10 usuários, 10 técnicos
- Kanban para OS
- App do técnico com notificações
- Integração WhatsApp
- Dashboard de performance
- Geração de relatórios personalizados
*/

-- =====================================================
-- VERIFICAÇÃO DOS PLANOS INSERIDOS
-- =====================================================

-- Verificar se os planos foram inseridos corretamente
SELECT 
    nome,
    descricao,
    preco,
    limite_usuarios,
    limite_produtos,
    limite_clientes,
    limite_fornecedores,
    recursos_disponiveis
FROM planos 
ORDER BY preco; 