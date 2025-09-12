-- Criar bucket ordens-imagens de forma simples
-- Execute este script no Supabase Dashboard > SQL Editor

-- Criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ordens-imagens', 'ordens-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'ordens-imagens';

-- Configurar políticas básicas
CREATE POLICY "Permitir upload de imagens" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ordens-imagens');

CREATE POLICY "Permitir visualização de imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'ordens-imagens');
