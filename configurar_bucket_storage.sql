-- Script para configurar o bucket de imagens no Supabase Storage
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Criar bucket para imagens das OSs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ordens-imagens', 'ordens-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de acesso para o bucket
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
