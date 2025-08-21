-- Script simples para configurar o bucket 'avatars'
-- Execute este script no SQL Editor do Supabase

-- 1. Criar o bucket 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política simples para permitir tudo (para teste)
CREATE POLICY "Permitir tudo para avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 3. Verificar se foi criado
SELECT * FROM storage.buckets WHERE id = 'avatars'; 