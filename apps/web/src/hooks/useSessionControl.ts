/**
 * Hook de controle de sessões - DESABILITADO TEMPORARIAMENTE
 * 
 * Este sistema foi temporariamente desabilitado devido a problemas de loop infinito.
 * Quando precisar reativar, implementar uma solução mais simples e robusta.
 */

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActivity: Date;
  isActive: boolean;
}

export interface SessionControl {
  currentSession: SessionInfo | null;
  isPrimarySession: boolean;
  timeUntilLogout: number | null;
  sessionsEnabled: boolean;
  registerSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  updateActivity: () => Promise<void>;
  logoutOtherSessions: () => Promise<void>;
  forceLogout: () => Promise<void>;
}

/**
 * Hook simplificado que retorna valores padrão sem funcionalidade
 */
export function useSessionControl(): SessionControl {
  return {
    currentSession: null,
    isPrimarySession: false,
    timeUntilLogout: null,
    sessionsEnabled: false,
    registerSession: async () => {
      },
    validateSession: async () => {
      return true;
    },
    updateActivity: async () => {
      },
    logoutOtherSessions: async () => {
      },
    forceLogout: async () => {
      }
  };
}