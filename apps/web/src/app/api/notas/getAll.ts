import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: colunas, error: erroColunas } = await supabase
      .from('colunas_dashboard')
      .select('*')
      .order('posicao', { ascending: true });

    if (erroColunas) {
      console.error('Erro ao buscar colunas:', erroColunas);
      return res.status(500).json({ error: 'Erro ao buscar colunas' });
    }

    const { data: notas, error: erroNotas } = await supabase
      .from('notas_dashboard')
      .select('*');

    if (erroNotas) {
      console.error('Erro ao buscar notas:', erroNotas);
      return res.status(500).json({ error: 'Erro ao buscar notas' });
    }

    return res.status(200).json({ colunas, notas });
  } catch (err: any) {
    console.error('Erro inesperado:', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
