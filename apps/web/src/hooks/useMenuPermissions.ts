import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

interface MenuPermissions {
  // Páginas principais
  dashboard: boolean;
  lembretes: boolean;
  ordensServico: boolean;
  caixa: boolean;
  
  // Contatos e submenus
  contatos: boolean;
  clientes: boolean;
  fornecedores: boolean;
  
  // Produtos/Serviços e submenus
  produtosServicos: boolean;
  produtos: boolean;
  categorias: boolean;
  
  // Financeiro e submenus
  financeiro: boolean;
  contasReceber: boolean;
  contasPagar: boolean;
  fluxoCaixa: boolean;
  relatorios: boolean;
  
  // Outras funcionalidades
  bancada: boolean;
  comissoes: boolean;
  termos: boolean;
  perfil: boolean;
  configuracoes: boolean;
  
  // Meta informações
  isUsuarioTeste: boolean;
  nivel: string;
  loading: boolean;
}

export const useMenuPermissions = (): MenuPermissions => {
  const { usuarioData, loading, podeUsarFuncionalidade, isUsuarioTeste } = useAuth();
  
  const permissions = useMemo(() => {
    if (loading || !usuarioData) {
      return {
        dashboard: false,
        lembretes: false,
        ordensServico: false,
        caixa: false,
        contatos: false,
        clientes: false,
        fornecedores: false,
        produtosServicos: false,
        produtos: false,
        categorias: false,
        financeiro: false,
        contasReceber: false,
        contasPagar: false,
        fluxoCaixa: false,
        relatorios: false,
        bancada: false,
        comissoes: false,
        termos: false,
        perfil: false,
        configuracoes: false,
        isUsuarioTeste: false,
        nivel: '',
        loading: true
      };
    }
    
    // Usuários de teste têm acesso total
    const isTestUser = isUsuarioTeste();
    
    if (isTestUser) {
      return {
        dashboard: true,
        lembretes: true,
        ordensServico: true,
        caixa: true,
        contatos: true,
        clientes: true,
        fornecedores: true,
        produtosServicos: true,
        produtos: true,
        categorias: true,
        financeiro: true,
        contasReceber: true,
        contasPagar: true,
        fluxoCaixa: true,
        relatorios: true,
        bancada: true,
        comissoes: true,
        termos: true,
        perfil: true,
        configuracoes: true,
        isUsuarioTeste: true,
        nivel: usuarioData.nivel,
        loading: false
      };
    }
    
    // Verificações baseadas em permissões específicas
    return {
      // Páginas principais - geralmente todos têm acesso
      dashboard: podeUsarFuncionalidade('dashboard'),
      lembretes: podeUsarFuncionalidade('lembretes'),
      ordensServico: podeUsarFuncionalidade('ordens'),
      caixa: podeUsarFuncionalidade('caixa'),
      
      // Contatos
      contatos: podeUsarFuncionalidade('clientes'),
      clientes: podeUsarFuncionalidade('clientes'),
      fornecedores: podeUsarFuncionalidade('fornecedores'),
      
      // Produtos/Serviços
      produtosServicos: podeUsarFuncionalidade('equipamentos'),
      produtos: podeUsarFuncionalidade('equipamentos'),
      categorias: podeUsarFuncionalidade('equipamentos'),
      
      // Financeiro
      financeiro: podeUsarFuncionalidade('financeiro'),
      contasReceber: podeUsarFuncionalidade('financeiro'),
      contasPagar: podeUsarFuncionalidade('financeiro'),
      fluxoCaixa: podeUsarFuncionalidade('financeiro'),
      relatorios: podeUsarFuncionalidade('financeiro'),
      
      // Outras funcionalidades
      bancada: podeUsarFuncionalidade('bancada'),
      comissoes: podeUsarFuncionalidade('comissoes'),
      termos: podeUsarFuncionalidade('termos'),
      perfil: podeUsarFuncionalidade('perfil'),
      configuracoes: podeUsarFuncionalidade('configuracoes'),
      
      // Meta informações
      isUsuarioTeste: isTestUser,
      nivel: usuarioData.nivel,
      loading: false
    };
  }, [usuarioData, loading, podeUsarFuncionalidade, isUsuarioTeste]);
  
  return permissions;
};

// Hook auxiliar para verificações específicas
export const useCanAccess = (funcionalidade: string): boolean => {
  const { podeUsarFuncionalidade } = useAuth();
  return podeUsarFuncionalidade(funcionalidade);
};

// Hook para verificar múltiplas permissões
export const useCanAccessMultiple = (funcionalidades: string[]): Record<string, boolean> => {
  const { podeUsarFuncionalidade } = useAuth();
  
  return useMemo(() => {
    return funcionalidades.reduce((acc, func) => {
      acc[func] = podeUsarFuncionalidade(func);
      return acc;
    }, {} as Record<string, boolean>);
  }, [funcionalidades, podeUsarFuncionalidade]);
};