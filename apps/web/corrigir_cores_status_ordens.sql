-- Script para corrigir as cores dos status na página de ordens
-- Execute este script no Supabase SQL Editor para garantir que os status tenham cores corretas

-- 1. Verificar se a tabela status_fixo existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_fixo') THEN
        CREATE TABLE status_fixo (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cor VARCHAR(7) NOT NULL,
            ordem INTEGER NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela status_fixo criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela status_fixo já existe';
    END IF;
END $$;

-- 2. Limpar dados existentes para evitar duplicatas
DELETE FROM status_fixo;

-- 3. Inserir status fixos para OS com cores corretas
INSERT INTO status_fixo (id, nome, cor, ordem, tipo) VALUES
(gen_random_uuid(), 'ABERTA', '#6b7280', 1, 'os'),
(gen_random_uuid(), 'EM ANÁLISE', '#3b82f6', 2, 'os'),
(gen_random_uuid(), 'EM EXECUÇÃO', '#8b5cf6', 3, 'os'),
(gen_random_uuid(), 'ORÇAMENTO', '#f59e0b', 4, 'os'),
(gen_random_uuid(), 'ORÇAMENTO ENVIADO', '#f59e0b', 5, 'os'),
(gen_random_uuid(), 'AGUARDANDO APROVAÇÃO', '#f97316', 6, 'os'),
(gen_random_uuid(), 'AGUARDANDO PEÇA', '#f59e0b', 7, 'os'),
(gen_random_uuid(), 'AGUARDANDO INÍCIO', '#6b7280', 8, 'os'),
(gen_random_uuid(), 'CONCLUIDO', '#10b981', 9, 'os'),
(gen_random_uuid(), 'FINALIZADO', '#10b981', 10, 'os'),
(gen_random_uuid(), 'ENTREGUE', '#10b981', 11, 'os'),
(gen_random_uuid(), 'APROVADO', '#10b981', 12, 'os'),
(gen_random_uuid(), 'RETORNO PARA GARANTIA', '#ef4444', 13, 'os'),
(gen_random_uuid(), 'CLIENTE RECUSOU', '#ef4444', 14, 'os'),
(gen_random_uuid(), 'SEM REPARO', '#ef4444', 15, 'os'),
(gen_random_uuid(), 'REPARO CONCLUÍDO', '#10b981', 16, 'os'),
(gen_random_uuid(), 'NAO APROVADO', '#ef4444', 17, 'os');

-- 4. Inserir status fixos para técnico com cores corretas
INSERT INTO status_fixo (id, nome, cor, ordem, tipo) VALUES
(gen_random_uuid(), 'AGUARDANDO INÍCIO', '#6b7280', 1, 'tecnico'),
(gen_random_uuid(), 'EM ANÁLISE', '#3b82f6', 2, 'tecnico'),
(gen_random_uuid(), 'ORÇAMENTO ENVIADO', '#f59e0b', 3, 'tecnico'),
(gen_random_uuid(), 'AGUARDANDO PEÇA', '#f59e0b', 4, 'tecnico'),
(gen_random_uuid(), 'EM EXECUÇÃO', '#8b5cf6', 5, 'tecnico'),
(gen_random_uuid(), 'SEM REPARO', '#ef4444', 6, 'tecnico'),
(gen_random_uuid(), 'REPARO CONCLUÍDO', '#10b981', 7, 'tecnico');

-- 5. Verificar se os dados foram inseridos corretamente
SELECT 'Status fixos para OS:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

SELECT 'Status fixos para técnico:' as info;
SELECT id, nome, cor, ordem, tipo
FROM status_fixo
WHERE tipo = 'tecnico'
ORDER BY ordem;

-- 6. Contar total de status por tipo
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM status_fixo
GROUP BY tipo
ORDER BY tipo;

-- 7. Verificar se existem ordens para testar
SELECT 'Verificando ordens existentes:' as info;
SELECT COUNT(*) as total_ordens FROM ordens_servico;

SELECT 'Status das ordens existentes:' as info;
SELECT 
  status,
  status_tecnico,
  COUNT(*) as quantidade
FROM ordens_servico
GROUP BY status, status_tecnico
ORDER BY status, status_tecnico;

-- 8. Verificar se as cores estão sendo aplicadas corretamente
SELECT 'Testando cores dos status:' as info;
SELECT 
  nome,
  cor,
  tipo,
  CASE 
    WHEN cor = '#10b981' THEN 'Verde (Concluído/Finalizado)'
    WHEN cor = '#3b82f6' THEN 'Azul (Em Análise)'
    WHEN cor = '#f59e0b' THEN 'Amarelo/Laranja (Aguardando/Orçamento)'
    WHEN cor = '#8b5cf6' THEN 'Roxo (Em Execução)'
    WHEN cor = '#ef4444' THEN 'Vermelho (Erro/Recusado)'
    WHEN cor = '#f97316' THEN 'Laranja (Aguardando Aprovação)'
    WHEN cor = '#6b7280' THEN 'Cinza (Aguardando Início)'
    ELSE 'Cor customizada: ' || cor
  END as descricao_cor
FROM status_fixo
ORDER BY tipo, ordem;
