# Troubleshooting de Autenticação - Supabase

## Problema: "Invalid Refresh Token: Refresh Token Not Found"

Este erro ocorre quando o refresh token do Supabase está inválido, expirado ou corrompido. Implementamos várias soluções para lidar com esse problema.

## Soluções Implementadas

### 1. Cliente Supabase Melhorado

O cliente Supabase foi configurado com opções otimizadas:

```typescript
// src/lib/supabaseClient.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,        // Refresh automático
    persistSession: true,          // Persistir sessão
    detectSessionInUrl: true,      // Detectar sessão na URL
    flowType: 'pkce',             // Fluxo PKCE mais seguro
    debug: process.env.NODE_ENV === 'development',
  },
});
```

### 2. AuthContext Aprimorado

O AuthContext agora inclui:

- **Verificação de sessão válida** antes de carregar dados
- **Limpeza automática** de dados corrompidos
- **Tratamento de erros** específicos para refresh token
- **Função clearSession** para limpar dados locais

### 3. Utilitários de Debug

Criamos utilitários para diagnosticar e resolver problemas:

```typescript
// src/utils/authUtils.ts
- clearAllAuthData()     // Limpa todos os dados de auth
- checkAuthIssues()      // Verifica problemas de auth
- refreshAuthToken()     // Força refresh do token
- reinitializeAuth()     // Reinicializa autenticação
```

### 4. Componente de Debug

O componente `AuthDebug` (visível apenas em desenvolvimento) permite:

- Visualizar status da autenticação
- Detectar problemas automaticamente
- Executar ações corretivas
- Limpar dados corrompidos

## Como Resolver o Problema

### Solução Imediata

1. **Abra o console do navegador** (F12)
2. **Procure pelo componente AuthDebug** (canto inferior direito)
3. **Clique em "Clear All Data"** para limpar dados corrompidos
4. **Recarregue a página** e faça login novamente

### Solução Programática

```typescript
import { clearAllAuthData, reinitializeAuth } from '@/utils/authUtils';

// Limpar todos os dados de autenticação
clearAllAuthData();

// Ou reinicializar a autenticação
const success = await reinitializeAuth();
```

### Solução Manual

1. **Abra o DevTools** (F12)
2. **Vá para Application/Storage**
3. **Local Storage** → Delete todas as chaves que começam com `sb-`
4. **Session Storage** → Delete todas as chaves que começam com `sb-`
5. **Recarregue a página**

## Prevenção de Problemas

### 1. Configurações Recomendadas

```typescript
// Sempre use estas configurações no cliente Supabase
{
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
}
```

### 2. Tratamento de Erros

```typescript
// Sempre envolva chamadas de auth em try-catch
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    // Tratar erro específico
    if (error.message.includes('Refresh Token')) {
      clearAllAuthData();
    }
  }
} catch (error) {
  console.error('Erro inesperado:', error);
}
```

### 3. Verificação de Sessão

```typescript
// Use a função isValidSession antes de operações críticas
import { isValidSession } from '@/lib/supabaseClient';

const isValid = await isValidSession();
if (!isValid) {
  // Redirecionar para login ou limpar dados
}
```

## Debugging

### 1. Componente AuthDebug

O componente de debug mostra:

- Status de loading
- Status do usuário
- Status da sessão
- Dados do usuário e empresa
- Status do localStorage
- Problemas detectados automaticamente

### 2. Ações Disponíveis

- **Clear Session**: Limpa apenas a sessão atual
- **Refresh Token**: Força refresh do token
- **Reinitialize Auth**: Reinicializa toda a autenticação
- **Clear All Data**: Limpa todos os dados de auth

### 3. Logs de Debug

Verifique o console do navegador para logs detalhados:

```
AuthContext: Iniciando checkSession
AuthContext: Sessão inválida, limpando dados
AuthContext: Refresh token inválido, limpando dados
```

## Causas Comuns

### 1. Token Expirado
- **Sintoma**: "Invalid Refresh Token"
- **Solução**: Refresh automático ou limpeza manual

### 2. Dados Corrompidos
- **Sintoma**: Erros inesperados de auth
- **Solução**: `clearAllAuthData()`

### 3. Problemas de Rede
- **Sintoma**: Timeout em operações de auth
- **Solução**: Verificar conectividade e tentar novamente

### 4. Configuração Incorreta
- **Sintoma**: Erros de inicialização
- **Solução**: Verificar variáveis de ambiente

## Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Monitoramento

### 1. Logs de Produção

Em produção, monitore:

- Erros de refresh token
- Falhas de autenticação
- Tempo de resposta das operações de auth

### 2. Métricas Importantes

- Taxa de sucesso de login
- Taxa de refresh token
- Tempo médio de carregamento de sessão

## Próximos Passos

1. **Implementar retry automático** para operações de auth
2. **Adicionar métricas** de performance de auth
3. **Implementar fallback** para quando Supabase está indisponível
4. **Adicionar notificações** para problemas de auth

## Suporte

Se o problema persistir:

1. Verifique os logs no console
2. Use o componente AuthDebug para diagnóstico
3. Teste com `clearAllAuthData()`
4. Verifique a conectividade com Supabase
5. Consulte a documentação oficial do Supabase Auth 