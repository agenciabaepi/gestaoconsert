-- Configurar bucket para imagens das OSs
-- Este script deve ser executado no Supabase Dashboard > Storage

-- 1. Criar bucket 'ordens-imagens' se não existir
-- 2. Configurar políticas de acesso

-- Política para permitir upload de imagens
CREATE POLICY "Permitir upload de imagens" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ordens-imagens');

-- Política para permitir visualização de imagens
CREATE POLICY "Permitir visualização de imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'ordens-imagens');

-- Política para permitir atualização de imagens
CREATE POLICY "Permitir atualização de imagens" ON storage.objects
FOR UPDATE USING (bucket_id = 'ordens-imagens');

-- Política para permitir exclusão de imagens
CREATE POLICY "Permitir exclusão de imagens" ON storage.objects
FOR DELETE USING (bucket_id = 'ordens-imagens'); 