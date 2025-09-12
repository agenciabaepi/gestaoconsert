-- Script para gerar e inserir status fixos com UUIDs válidos
-- Execute este script para inserir os status fixos

-- Inserir status fixos para OS
INSERT INTO status_fixo (id, nome, cor, ordem, tipo) VALUES
(gen_random_uuid(), 'APROVADO', '#10b981', 1, 'os'),
(gen_random_uuid(), 'EM ANÁLISE', '#3b82f6', 2, 'os'),
(gen_random_uuid(), 'EM EXECUÇÃO', '#8b5cf6', 3, 'os'),
(gen_random_uuid(), 'ORÇAMENTO', '#f59e0b', 4, 'os'),
(gen_random_uuid(), 'AGUARDANDO APROVAÇÃO', '#f97316', 5, 'os'),
(gen_random_uuid(), 'RETORNO PARA GARANTIA', '#ef4444', 6, 'os'),
(gen_random_uuid(), 'AGUARDANDO PEÇA', '#f59e0b', 7, 'os'),
(gen_random_uuid(), 'ORÇAMENTO ENVIADO', '#f59e0b', 8, 'os'),
(gen_random_uuid(), 'AGUARDANDO INÍCIO', '#6b7280', 9, 'os'),
(gen_random_uuid(), 'ENTREGUE', '#10b981', 10, 'os'),
(gen_random_uuid(), 'FINALIZADO', '#10b981', 11, 'os'),
(gen_random_uuid(), 'CLIENTE RECUSOU', '#ef4444', 12, 'os'),
(gen_random_uuid(), 'SEM REPARO', '#ef4444', 13, 'os'),
(gen_random_uuid(), 'REPARO CONCLUÍDO', '#10b981', 14, 'os');

-- Inserir status fixos para técnico
INSERT INTO status_fixo (id, nome, cor, ordem, tipo) VALUES
(gen_random_uuid(), 'AGUARDANDO INÍCIO', '#6b7280', 1, 'tecnico'),
(gen_random_uuid(), 'EM ANÁLISE', '#3b82f6', 2, 'tecnico'),
(gen_random_uuid(), 'ORÇAMENTO ENVIADO', '#f59e0b', 3, 'tecnico'),
(gen_random_uuid(), 'AGUARDANDO PEÇA', '#f59e0b', 4, 'tecnico'),
(gen_random_uuid(), 'EM EXECUÇÃO', '#8b5cf6', 5, 'tecnico'),
(gen_random_uuid(), 'SEM REPARO', '#ef4444', 6, 'tecnico'),
(gen_random_uuid(), 'REPARO CONCLUÍDO', '#10b981', 7, 'tecnico');

-- Verificar se os dados foram inseridos
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM status_fixo
GROUP BY tipo
ORDER BY tipo;

-- Mostrar os status inseridos
SELECT 
  id,
  nome,
  cor,
  ordem,
  tipo
FROM status_fixo
ORDER BY tipo, ordem; 