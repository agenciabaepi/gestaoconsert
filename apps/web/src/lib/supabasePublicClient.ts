import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente separado para páginas públicas (sem interferir na sessão do usuário)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Não persistir sessão
    autoRefreshToken: false, // Não renovar token automaticamente
    detectSessionInUrl: false, // Não detectar sessão na URL
    storage: undefined // Não usar storage para evitar conflitos
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-public-client'
    }
  }
});
