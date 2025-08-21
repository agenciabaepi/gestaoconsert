# Configuração da Service Role Key do Supabase

## Problema
Para excluir usuários do Supabase Auth, é necessária a **Service Role Key** que tem privilégios de administrador.

## Solução

### 1. Obter a Service Role Key
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. Copie a **service_role** key (não a anon key)

### 2. Configurar a Variável de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (`apps/web/.env.local`) com:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 3. Reiniciar o Servidor
Após adicionar a variável de ambiente, reinicie o servidor:

```bash
npm run dev
```

## Verificação
Após a configuração, quando excluir um usuário, você verá no console:
- "Usuário excluído do Auth com sucesso: [user_id]" - se funcionou
- "Erro ao excluir usuário do Auth" - se ainda não está configurado

## Importante
- A Service Role Key tem privilégios de administrador
- Nunca exponha essa key no frontend
- Use apenas em API routes do servidor
- Mantenha a key segura e não a compartilhe

## Alternativa
Se não conseguir configurar a Service Role Key, o sistema ainda funcionará, mas os usuários excluídos permanecerão no Supabase Auth (apenas serão removidos da tabela `usuarios`). 