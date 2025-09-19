-- Script para atualizar status_tecnico das OSs existentes
-- Executar este script para definir o status técnico padrão para OSs que não têm

-- Atualizar OSs que não têm status_tecnico definido
UPDATE ordens_servico 
SET status_tecnico = 'AGUARDANDO INÍCIO'
WHERE status_tecnico IS NULL OR status_tecnico = '';

-- Corrigir valores antigos como "em atendimento"
UPDATE ordens_servico 
SET status_tecnico = 'AGUARDANDO INÍCIO'
WHERE status_tecnico = 'em atendimento';

-- Atualizar OSs com status 'ABERTA' para ter status técnico 'AGUARDANDO INÍCIO'
UPDATE ordens_servico 
SET status_tecnico = 'AGUARDANDO INÍCIO'
WHERE status = 'ABERTA' AND (status_tecnico IS NULL OR status_tecnico = '');

-- Atualizar OSs com status 'EM_ANALISE' para ter status técnico 'EM ANÁLISE'
UPDATE ordens_servico 
SET status_tecnico = 'EM ANÁLISE'
WHERE status = 'EM_ANALISE' AND (status_tecnico IS NULL OR status_tecnico = '');

-- Atualizar OSs com status 'AGUARDANDO_PECA' para ter status técnico 'AGUARDANDO PEÇA'
UPDATE ordens_servico 
SET status_tecnico = 'AGUARDANDO PEÇA'
WHERE status = 'AGUARDANDO_PECA' AND (status_tecnico IS NULL OR status_tecnico = '');

-- Atualizar OSs com status 'CONCLUIDO' para ter status técnico 'REPARO CONCLUÍDO'
UPDATE ordens_servico 
SET status_tecnico = 'REPARO CONCLUÍDO'
WHERE status = 'CONCLUIDO' AND (status_tecnico IS NULL OR status_tecnico = '');

-- Mapear outros status para valores corretos
UPDATE ordens_servico 
SET status_tecnico = 'EM ANÁLISE'
WHERE status = 'EM ANÁLISE' AND status_tecnico != 'EM ANÁLISE';

UPDATE ordens_servico 
SET status_tecnico = 'REPARO CONCLUÍDO'
WHERE status = 'FINALIZADO' AND status_tecnico != 'REPARO CONCLUÍDO';

-- Verificar resultado
SELECT 
  status,
  status_tecnico,
  COUNT(*) as quantidade
FROM ordens_servico 
GROUP BY status, status_tecnico
ORDER BY status, status_tecnico; 