-- Script para verificar os dados da tabela status_fixo
-- Executar este script para verificar se os status fixos estão corretos

-- Verificar todos os status fixos
SELECT 
  id,
  nome,
  cor,
  ordem,
  tipo
FROM status_fixo
ORDER BY tipo, ordem;

-- Verificar status fixos do tipo 'os'
SELECT 
  id,
  nome,
  cor,
  ordem,
  tipo
FROM status_fixo
WHERE tipo = 'os'
ORDER BY ordem;

-- Verificar status fixos do tipo 'tecnico'
SELECT 
  id,
  nome,
  cor,
  ordem,
  tipo
FROM status_fixo
WHERE tipo = 'tecnico'
ORDER BY ordem;

-- Contar quantos status fixos existem por tipo
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM status_fixo
GROUP BY tipo
ORDER BY tipo; 