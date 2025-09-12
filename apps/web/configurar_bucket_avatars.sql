-- Script para configurar o bucket 'avatars' e suas políticas de acesso
-- Execute este script no SQL Editor do Supabase

-- 1. Criar o bucket 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir upload de avatars (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload de avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 3. Política para permitir visualização de avatars (público)
CREATE POLICY "Qualquer pessoa pode visualizar avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Política para permitir atualização de avatars (apenas o próprio usuário)
CREATE POLICY "Usuários podem atualizar seus próprios avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text
);

-- 5. Política para permitir remoção de avatars (apenas o próprio usuário)
CREATE POLICY "Usuários podem remover seus próprios avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text
);

-- 6. Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 7. Verificar as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 