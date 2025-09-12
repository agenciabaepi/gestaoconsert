// Configuração de permissões para cada página do sistema
export const PAGE_PERMISSIONS = {
  // Dashboard
  '/dashboard': 'dashboard',
  
  // Lembretes
  '/lembretes': 'lembretes',
  
  // Ordens de Serviço
  '/ordens': 'ordens',
  '/ordens/[id]': 'ordens',
  '/ordens/nova': 'ordens',
  
  // Bancada
  '/bancada': 'bancada',
  '/bancada/[id]': 'bancada',
  
  // Caixa
  '/caixa': 'caixa',
  '/caixa/pdv': 'caixa',
  '/caixa/movimentacoes': 'caixa',
  
  // Clientes
  '/clientes': 'clientes',
  '/clientes/[id]': 'clientes',
  '/clientes/novo': 'clientes',
  
  // Fornecedores
  '/fornecedores': 'fornecedores',
  '/fornecedores/[id]': 'fornecedores',
  '/fornecedores/novo': 'fornecedores',
  
  // Equipamentos
  '/equipamentos': 'equipamentos',
  '/equipamentos/[id]': 'equipamentos',
  '/equipamentos/novo': 'equipamentos',
  '/equipamentos/categorias': 'equipamentos',
  
  // Catálogo
  '/catalogo': 'catalogo',
  
  // Financeiro
  '/financeiro/vendas': 'vendas',
  '/financeiro/movimentacoes-caixa': 'movimentacao-caixa',
  '/financeiro/contas-a-pagar': 'contas-a-pagar',
  
  // Movimentações Caixa
  '/movimentacao-caixa': 'movimentacao-caixa',
  
  // Termos
  '/termos': 'termos',
  '/termos/[id]': 'termos',
  '/termos/novo': 'termos',
  
  // Comissões (apenas técnicos)
  '/comissoes': 'dashboard', // Técnicos sempre têm dashboard
  
  // Perfil (todos os usuários logados)
  '/perfil': 'dashboard', // Usuários logados sempre têm dashboard
  
  // Configurações (apenas admin)
  '/configuracoes': 'configuracoes',
  '/configuracoes/usuarios': 'configuracoes',
  '/configuracoes/usuarios/[id]': 'configuracoes',
  '/configuracoes/usuarios/[id]/editar': 'configuracoes',
  
  // Relatórios
  '/relatorios': 'relatorios',
  
  // Usuários
  '/usuarios': 'usuarios',
  
  // Backup
  '/backup': 'backup',
  
  // Logs
  '/logs': 'logs',
  
  // API
  '/api': 'api',
} as const;

// Função para obter a permissão necessária para uma rota
export function getRequiredPermission(pathname: string): string | null {
  // Remove query parameters
  const cleanPath = pathname.split('?')[0];
  
  // Procura por correspondência exata primeiro
  if (PAGE_PERMISSIONS[cleanPath as keyof typeof PAGE_PERMISSIONS]) {
    return PAGE_PERMISSIONS[cleanPath as keyof typeof PAGE_PERMISSIONS];
  }
  
  // Procura por correspondência com parâmetros dinâmicos
  for (const [route, permission] of Object.entries(PAGE_PERMISSIONS)) {
    if (route.includes('[') && route.includes(']')) {
      // Converte rota com parâmetros em regex
      const routeRegex = route
        .replace(/\[.*?\]/g, '[^/]+') // [id] -> [^/]+
        .replace(/\//g, '\\/'); // / -> \/
      
      if (new RegExp(`^${routeRegex}$`).test(cleanPath)) {
        return permission;
      }
    }
  }
  
  // Se não encontrar, retorna null (sem proteção)
  return null;
}

// Função para verificar se uma rota precisa de proteção
export function needsProtection(pathname: string): boolean {
  return getRequiredPermission(pathname) !== null;
}
