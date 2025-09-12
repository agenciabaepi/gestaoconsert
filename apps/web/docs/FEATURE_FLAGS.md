# Sistema de Feature Flags

Este documento explica como usar o sistema de feature flags implementado para controlar o acesso a funcionalidades em desenvolvimento/teste.

## Visão Geral

O sistema de feature flags permite que usuários com nível "usuarioteste" tenham acesso **TOTAL** ao sistema + funcionalidades que ainda estão em desenvolvimento. Usuários normais não veem as funcionalidades de teste.

## Como Funciona

### 1. Configuração das Feature Flags

As funcionalidades disponíveis para teste são definidas no arquivo `src/config/featureFlags.ts`:

```typescript
export const funcionalidadesEmTeste = [
  "conversas_whatsapp",
  "relatorio_novo",
  "dashboard_avancado",
  "analytics_empresa",
  "integracao_api"
];
```

### 2. Verificação de Usuário de Teste

Para que um usuário tenha acesso às funcionalidades de teste, ele deve ter o campo `nivel` definido como `"usuarioteste"` na tabela `usuarios`.

### 3. Funções Disponíveis

#### `isUsuarioTeste(usuario)`
Verifica se um usuário é um usuário de teste.

```typescript
import { isUsuarioTeste } from '@/config/featureFlags';

const usuarioTeste = isUsuarioTeste(usuarioData);
if (usuarioTeste) {
  // Usuário pode acessar funcionalidades de teste
}
```

#### `podeUsarFuncionalidade(usuario, nomeFuncionalidade)`
Verifica se um usuário pode usar uma funcionalidade específica.

**Importante:** Usuários com `nivel = 'usuarioteste'` têm acesso a **TODAS** as funcionalidades automaticamente.

```typescript
import { podeUsarFuncionalidade } from '@/config/featureFlags';

if (podeUsarFuncionalidade(usuarioData, "conversas_whatsapp")) {
  // Mostrar funcionalidade de conversas WhatsApp
  // Para usuários de teste: sempre true
  // Para outros usuários: apenas se estiver na lista de funcionalidades em teste
}
```

## Implementação no MenuLayout

O `MenuLayout` foi atualizado para incluir uma seção especial de funcionalidades em teste para usuários de teste:

```tsx
{/* Funcionalidades de teste para usuários de teste */}
{isUsuarioTeste(usuarioData) && (
  <>
    <div className="border-t border-white/20 my-2"></div>
    <div className="px-3 py-2 text-xs font-medium text-white/60">
      🔬 FUNCIONALIDADES EM TESTE
    </div>
    
    {podeUsarFuncionalidade(usuarioData, "conversas_whatsapp") && (
      <SidebarButton 
        path="/teste/conversas-whatsapp" 
        icon={<FiMessageCircle size={20} />} 
        label="Conversas WhatsApp" 
        isActive={pathname === '/teste/conversas-whatsapp'} 
        menuRecolhido={menuRecolhido} 
      />
    )}
  </>
)}
```

## Uso em Componentes

### Exemplo Básico

```tsx
import { useAuth } from '@/context/AuthContext';
import { podeUsarFuncionalidade } from '@/config/featureFlags';

export default function MeuComponente() {
  const { usuarioData } = useAuth();

  return (
    <div>
      {/* Conteúdo normal */}
      <h1>Minha Página</h1>
      
      {/* Funcionalidade de teste */}
      {podeUsarFuncionalidade(usuarioData, "relatorio_novo") && (
        <div className="bg-yellow-100 p-4 rounded">
          <h2>🔬 Relatório Novo (Em Teste)</h2>
          <p>Esta funcionalidade está em desenvolvimento.</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Testar Funcionalidade
          </button>
        </div>
      )}
    </div>
  );
}
```

### Exemplo com Renderização Condicional

```tsx
import { useAuth } from '@/context/AuthContext';
import { podeUsarFuncionalidade } from '@/config/featureFlags';

export default function Dashboard() {
  const { usuarioData } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Dashboard básico - sempre visível */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2>Dashboard Básico</h2>
        {/* Conteúdo básico */}
      </div>
      
      {/* Dashboard avançado - apenas para usuários de teste */}
      {podeUsarFuncionalidade(usuarioData, "dashboard_avancado") && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow">
          <h2>🔬 Dashboard Avançado (Beta)</h2>
          <p>Versão experimental com métricas avançadas</p>
          {/* Conteúdo avançado */}
        </div>
      )}
    </div>
  );
}
```

## Adicionando Novas Funcionalidades

Para adicionar uma nova funcionalidade de teste:

1. **Adicione o nome da funcionalidade** ao array `funcionalidadesEmTeste`:

```typescript
export const funcionalidadesEmTeste = [
  "conversas_whatsapp",
  "relatorio_novo",
  "dashboard_avancado",
  "analytics_empresa",
  "integracao_api",
  "nova_funcionalidade" // ← Nova funcionalidade
];
```

2. **Use a função `podeUsarFuncionalidade`** no seu componente:

```tsx
{podeUsarFuncionalidade(usuarioData, "nova_funcionalidade") && (
  <div>Nova funcionalidade em teste</div>
)}
```

3. **Adicione ao menu** (opcional):

```tsx
{podeUsarFuncionalidade(usuarioData, "nova_funcionalidade") && (
  <SidebarButton 
    path="/teste/nova-funcionalidade" 
    icon={<FiStar size={20} />} 
    label="Nova Funcionalidade" 
    isActive={pathname === '/teste/nova-funcionalidade'} 
    menuRecolhido={menuRecolhido} 
  />
)}
```

## Configuração no Banco de Dados

Para que um usuário tenha acesso às funcionalidades de teste:

1. Acesse a tabela `usuarios` no Supabase
2. Localize o usuário desejado
3. Altere o campo `nivel` para `"usuarioteste"`
4. Salve as alterações

```sql
UPDATE usuarios 
SET nivel = 'usuarioteste' 
WHERE email = 'usuario@exemplo.com';
```

## Segurança

- Apenas usuários com `nivel = 'usuarioteste'` podem acessar funcionalidades de teste
- As verificações são feitas tanto no frontend quanto no backend
- Usuários normais não veem nenhuma referência às funcionalidades de teste
- O sistema é flexível e permite adicionar/remover funcionalidades facilmente

## Exemplo Completo

Veja o componente `FeatureFlagExample.tsx` para um exemplo completo de como usar todas as funcionalidades do sistema de feature flags.

## Troubleshooting

### Funcionalidade não aparece
1. Verifique se o usuário tem `nivel = 'usuarioteste'`
2. Confirme se o nome da funcionalidade está correto no array `funcionalidadesEmTeste`
3. Verifique se está usando a função `podeUsarFuncionalidade` corretamente

### Erro de importação
1. Verifique se o caminho do import está correto
2. Confirme se o arquivo `featureFlags.ts` existe em `src/config/`
3. Verifique se as funções estão sendo exportadas corretamente

### Menu não atualiza
1. Verifique se o `MenuLayout` está usando as funções de feature flags
2. Confirme se o usuário está logado e os dados estão carregados
3. Verifique se não há erros no console do navegador
