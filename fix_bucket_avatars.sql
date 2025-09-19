-- Script robusto para configurar o bucket avatars
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes que possam estar causando conflito
DROP POLICY IF EXISTS "Permitir tudo avatars" ON storage.objects;
DROP POLICY IF EXISTS "Permitir tudo para avatars" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de avatars" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode visualizar avatars" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios avatars" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem remover seus próprios avatars" ON storage.objects;

-- 2. Criar o bucket avatars se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 3. Política simples para permitir tudo (para teste)
CREATE POLICY "Permitir tudo avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. Verificar se foi criado corretamente
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'avatars'; 