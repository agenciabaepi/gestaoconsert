// ✅ SISTEMA DE HISTÓRICO DE RECUSAS
// Utilitários para rastrear e exibir histórico de recusas de clientes

export interface HistoricoRecusa {
  temRecusa: boolean;
  dataRecusa?: string;
  observacoes?: string;
}

/**
 * Verifica se uma OS tem histórico de recusa do cliente
 */
export function verificarHistoricoRecusa(observacoes?: string | null): HistoricoRecusa {
  if (!observacoes) {
    return { temRecusa: false };
  }

  const temRecusa = observacoes.includes('🚫 CLIENTE RECUSOU ORÇAMENTO');
  
  if (!temRecusa) {
    return { temRecusa: false };
  }

  // Extrair data da recusa se possível
  const match = observacoes.match(/🚫 CLIENTE RECUSOU ORÇAMENTO - (.+?)(?:\n|$)/);
  const dataRecusa = match ? match[1] : undefined;

  return {
    temRecusa: true,
    dataRecusa,
    observacoes
  };
}

/**
 * Gera badge visual para recusa
 */
export function getBadgeRecusa(historico: HistoricoRecusa) {
  if (!historico.temRecusa) return null;

  return {
    texto: 'RECUSADO PELO CLIENTE',
    cor: 'bg-red-100 text-red-800 border-red-200',
    icone: '🚫',
    tooltip: historico.dataRecusa ? `Recusado em: ${historico.dataRecusa}` : 'Cliente recusou o orçamento'
  };
}

/**
 * Adiciona registro de recusa às observações
 */
export function adicionarRegistroRecusa(observacoesExistentes?: string | null): string {
  const dataRecusa = new Date().toLocaleString('pt-BR');
  const registroRecusa = `🚫 CLIENTE RECUSOU ORÇAMENTO - ${dataRecusa}`;
  
  // Verificar se já não existe esse registro para evitar duplicatas
  if (observacoesExistentes?.includes('🚫 CLIENTE RECUSOU ORÇAMENTO')) {
    return observacoesExistentes;
  }
  
  return observacoesExistentes 
    ? `${observacoesExistentes}\n\n${registroRecusa}`
    : registroRecusa;
}

/**
 * Lista de status que indicam recusa do cliente
 */
export const STATUS_RECUSA = [
  'CLIENTE RECUSOU',
  'RECUSADO',
  'NEGADO',
  'NÃO APROVADO',
  'REJEITADO'
];

/**
 * Verifica se um status indica recusa
 */
export function isStatusRecusa(status?: string): boolean {
  if (!status) return false;
  
  const statusUpper = status.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return STATUS_RECUSA.some(s => statusUpper.includes(s));
}
