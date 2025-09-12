import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições por janela
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest) => NextResponse;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    const defaultConfig: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutos por padrão
      maxRequests: 100, // 100 requisições por padrão
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req: any) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous',
      handler: (req: any) => {
        return NextResponse.json(
          { error: 'Too many requests, please try again later.' },
          { status: 429 }
        );
      }
    };
    
    this.config = { ...defaultConfig, ...config };
  }

  private getKey(req: NextRequest): string {
    return this.config.keyGenerator!(req);
  }

  private isRateLimitExceeded(key: string): boolean {
    const now = Date.now();
    const record = this.store[key];

    if (!record || now > record.resetTime) {
      // Reset ou criar novo record
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return false;
    }

    // Incrementar contador
    record.count++;
    return record.count > this.config.maxRequests;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }

  middleware() {
    return (req: NextRequest) => {
      // Limpeza periódica
      this.cleanup();

      const key = this.getKey(req);
      const isExceeded = this.isRateLimitExceeded(key);

      if (isExceeded) {
        return this.config.handler!(req);
      }

      return NextResponse.next();
    };
  }

  // Método para obter estatísticas
  getStats(): { [key: string]: { count: number; resetTime: number } } {
    return { ...this.store };
  }

  // Método para resetar rate limit
  reset(key?: string): void {
    if (key) {
      delete this.store[key];
    } else {
      this.store = {};
    }
  }
}

// Instâncias de rate limiter para diferentes endpoints
const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requisições por IP
  keyGenerator: (req) => {
    // Usar IP + user agent para melhor identificação
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${ip}-${userAgent}`;
  }
});

const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas de login por IP
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `auth-${ip}`;
  },
  handler: (req) => {
    return NextResponse.json(
      { error: 'Too many login attempts, please try again later.' },
      { status: 429 }
    );
  }
});

const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10, // 10 uploads por IP
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `upload-${ip}`;
  },
  handler: (req) => {
    return NextResponse.json(
      { error: 'Upload limit exceeded, please try again later.' },
      { status: 429 }
    );
  }
});

// Middleware principal
export function rateLimitMiddleware(req: NextRequest): NextResponse | undefined {
  const { pathname } = req.nextUrl;

  // Rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    // Rate limiting específico para autenticação
    if (pathname.startsWith('/api/auth/') || pathname.includes('login')) {
      return authRateLimiter.middleware()(req);
    }

    // Rate limiting para uploads
    if (pathname.includes('upload')) {
      return uploadRateLimiter.middleware()(req);
    }

    // Rate limiting geral para APIs
    return apiRateLimiter.middleware()(req);
  }

  return NextResponse.next();
}

// Middleware para Next.js
export function middleware(req: NextRequest) {
  return rateLimitMiddleware(req);
}

// Configuração do middleware
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Utilitários para monitoramento
export const rateLimitUtils = {
  getApiStats: () => apiRateLimiter.getStats(),
  getAuthStats: () => authRateLimiter.getStats(),
  getUploadStats: () => uploadRateLimiter.getStats(),
  resetApiLimit: (key?: string) => apiRateLimiter.reset(key),
  resetAuthLimit: (key?: string) => authRateLimiter.reset(key),
  resetUploadLimit: (key?: string) => uploadRateLimiter.reset(key),
};
