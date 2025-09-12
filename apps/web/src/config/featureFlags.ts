// Configuração centralizada de feature flags
// Define quais funcionalidades estão em desenvolvimento/teste

export const funcionalidadesEmTeste = [
  "conversas_whatsapp",
  "relatorio_novo",
  "dashboard_avancado",
  "analytics_empresa",
  "integracao_api"
];

// Função para verificar se um usuário pode usar uma funcionalidade específica
export function podeUsarFuncionalidade(usuario: any, nomeFuncionalidade: string): boolean {
  // Usuários de teste (usuarioteste) têm acesso a TUDO + funcionalidades em desenvolvimento
  if (usuario?.nivel === 'usuarioteste') {
    return true; // Acesso total para usuários de teste
  }
  
  // Para outros usuários, verifica se a funcionalidade está na lista de funcionalidades em teste
  return funcionalidadesEmTeste.includes(nomeFuncionalidade);
}

// Função para verificar se um usuário é um usuário de teste
export function isUsuarioTeste(usuario: any): boolean {
  return usuario?.nivel === 'usuarioteste';
}

// Função para obter todas as funcionalidades em teste
export function getFuncionalidadesEmTeste(): string[] {
  return [...funcionalidadesEmTeste];
}
