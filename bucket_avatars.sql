-- Criar bucket avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política simples para permitir tudo
CREATE POLICY "Permitir tudo avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars'); 