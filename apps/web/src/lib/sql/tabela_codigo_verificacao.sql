-- =====================================================
-- TABELA PARA CÓDIGOS DE VERIFICAÇÃO DE EMAIL
-- =====================================================

-- Criar tabela para armazenar códigos de verificação
CREATE TABLE IF NOT EXISTS public.codigo_verificacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usado_em TIMESTAMP WITH TIME ZONE NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_codigo_verificacao_usuario_id ON public.codigo_verificacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_codigo_verificacao_codigo ON public.codigo_verificacao(codigo);
CREATE INDEX IF NOT EXISTS idx_codigo_verificacao_email ON public.codigo_verificacao(email);
CREATE INDEX IF NOT EXISTS idx_codigo_verificacao_expira_em ON public.codigo_verificacao(expira_em);

-- Adicionar coluna para controlar se o usuário foi verificado
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Criar função para limpar códigos expirados automaticamente
CREATE OR REPLACE FUNCTION limpar_codigos_expirados()
RETURNS void AS $$
BEGIN
    DELETE FROM public.codigo_verificacao 
    WHERE expira_em < NOW() OR usado = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar política RLS para a tabela
ALTER TABLE public.codigo_verificacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios códigos
CREATE POLICY "Usuários podem ver seus próprios códigos" ON public.codigo_verificacao
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = codigo_verificacao.usuario_id 
            AND auth.uid() = usuarios.auth_user_id
        )
    );

-- Política para permitir inserção de códigos
CREATE POLICY "Permitir inserção de códigos" ON public.codigo_verificacao
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização de códigos próprios
CREATE POLICY "Usuários podem atualizar seus próprios códigos" ON public.codigo_verificacao
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = codigo_verificacao.usuario_id 
            AND auth.uid() = usuarios.auth_user_id
        )
    );

-- Adicionar comentários para documentação
COMMENT ON TABLE public.codigo_verificacao IS 'Tabela para armazenar códigos de verificação de email dos usuários';
COMMENT ON COLUMN public.codigo_verificacao.codigo IS 'Código de 6 dígitos para verificação';
COMMENT ON COLUMN public.codigo_verificacao.usado IS 'Indica se o código já foi utilizado';
COMMENT ON COLUMN public.codigo_verificacao.expira_em IS 'Data e hora de expiração do código (24 horas)';
COMMENT ON COLUMN public.usuarios.email_verificado IS 'Indica se o email do usuário foi verificado';
