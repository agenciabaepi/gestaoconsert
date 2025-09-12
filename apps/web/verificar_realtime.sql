-- Script para verificar configurações de Realtime no Supabase

-- Verificar se a tabela ordens_servico tem Realtime habilitado
SELECT 
  schemaname,
  tablename,
  hasreplication,
  hasupdatabletrigger
FROM pg_tables 
WHERE tablename = 'ordens_servico';

-- Verificar triggers na tabela
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'ordens_servico';

-- Verificar se o Realtime está habilitado globalmente
SELECT 
  name,
  setting,
  context
FROM pg_settings 
WHERE name LIKE '%realtime%' OR name LIKE '%logical%';

-- Verificar se há publications configuradas
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication;

-- Verificar se a tabela está em alguma publication
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE tablename = 'ordens_servico'; 