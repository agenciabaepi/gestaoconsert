-- Criar bucket para imagens das OSs
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Criar bucket 'ordens-imagens'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ordens-imagens', 
  'ordens-imagens', 
  true, 
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de acesso para o bucket

-- Política para permitir upload de imagens (INSERT)
CREATE POLICY "Permitir upload de imagens" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ordens-imagens');

-- Política para permitir visualização de imagens (SELECT)
CREATE POLICY "Permitir visualização de imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'ordens-imagens');

-- Política para permitir atualização de imagens (UPDATE)
CREATE POLICY "Permitir atualização de imagens" ON storage.objects
FOR UPDATE USING (bucket_id = 'ordens-imagens');

-- Política para permitir exclusão de imagens (DELETE)
CREATE POLICY "Permitir exclusão de imagens" ON storage.objects
FOR DELETE USING (bucket_id = 'ordens-imagens');

-- 3. Verificar se foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'ordens-imagens'; 