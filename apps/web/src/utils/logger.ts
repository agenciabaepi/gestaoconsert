// Utilitário de logging seguro para produção
const isDevelopment = process.env.NODE_ENV === 'development';

interface LogEvent {
  event: string;
  userId?: string;
  timestamp: number;
  data?: any;
  error?: any;
}

class Logger {
  private events: LogEvent[] = [];
  
  log(event: string, data?: any, error?: any) {
    const logEvent: LogEvent = {
      event,
      timestamp: Date.now(),
      data,
      error
    };
    
    this.events.push(logEvent);
    console.log(`[${new Date().toISOString()}] ${event}`, data, error);
    
    // Manter apenas os últimos 100 eventos
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }
  
  getEvents() {
    return this.events;
  }
  
  exportLogs() {
    return JSON.stringify(this.events, null, 2);
  }
}

export const logger = new Logger();

// Função para suprimir todos os logs em produção
export const suppressLogsInProduction = () => {
  if (process.env.NODE_ENV === 'production') {
    // Sobrescrever console.log, console.info, console.debug em produção
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.trace = () => {};
    
    // Manter apenas console.error e console.warn para erros críticos
    // console.error e console.warn são mantidos para debugging de produção
  }
};
