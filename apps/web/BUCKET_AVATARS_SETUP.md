# 🚨 **Configuração do Bucket de Avatars**

## 🔍 **Problema identificado:**
O bucket de armazenamento `avatars` não está configurado no Supabase, causando erro ao tentar fazer upload de foto de perfil.

## 🛠️ **Como resolver:**

### **Opção 1: Executar script SQL (Recomendado)**

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute o script:** `configurar_bucket_avatars.sql`

### **Opção 2: Configuração manual**

1. **Acesse Storage no Supabase**
2. **Clique em "New Bucket"**
3. **Configure:**
   - **Name:** `avatars`
   - **Public:** ✅ (marcado)
   - **File size limit:** 5MB
   - **Allowed MIME types:** image/*

### **Opção 3: Desabilitar upload de foto temporariamente**

Se não puder configurar o bucket agora, podemos desabilitar a funcionalidade de upload de foto.

## 📋 **Script SQL completo:**

```sql
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
```

## ✅ **Após a configuração:**

1. **Teste o upload de foto** na página de perfil
2. **Verifique se não há mais erros** de bucket
3. **Confirme que as fotos** estão sendo salvas corretamente

## 🆘 **Se ainda houver problemas:**

- **Verifique as políticas** de acesso no Supabase
- **Confirme as permissões** do usuário
- **Teste com uma conta** de administrador primeiro

---

**Status:** ⚠️ **Pendente de configuração**
**Prioridade:** 🔴 **Alta** (afeta funcionalidade de perfil)
