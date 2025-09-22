import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxamrvfusyrtkcshehfm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlZmYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTQ5NzI5MCwiZXhwIjoyMDUxMDczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público para operações do frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Cliente admin para operações do servidor
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Tipos para as tabelas principais
export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  auth_user_id?: string;
  nome: string;
  email: string;
  nivel: string;
  permissoes: string[];
  empresa_id: string;
  foto_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Pagamento {
  id: string;
  empresa_id: string;
  mercadopago_payment_id?: string;
  status: string;
  valor: number;
  created_at: string;
  paid_at?: string;
}

export interface Assinatura {
  id: string;
  empresa_id: string;
  plano_id: string;
  status: string;
  data_inicio: string;
  data_fim?: string;
  proxima_cobranca?: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface Plano {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  periodo: string;
  limite_usuarios: number;
  limite_produtos: number;
  limite_clientes: number;
  recursos_disponiveis: Record<string, any>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}


