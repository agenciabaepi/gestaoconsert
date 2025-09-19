-- Script para habilitar Realtime na tabela ordens_servico

-- 1. Criar publication se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

-- 2. Adicionar tabela ordens_servico à publication
ALTER PUBLICATION supabase_realtime ADD TABLE ordens_servico;

-- 3. Verificar se foi adicionada corretamente
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE tablename = 'ordens_servico';

-- 4. Verificar se a tabela tem as colunas necessárias para Realtime
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
  AND column_name IN ('id', 'empresa_id', 'status_tecnico', 'created_at', 'updated_at')
ORDER BY column_name; 