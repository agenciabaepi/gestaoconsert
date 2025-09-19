

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id, titulo, texto, cor, prioridade, coluna, pos_x, pos_y } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da nota é obrigatório' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('notas_dashboard')
    .update({
      titulo,
      texto,
      cor,
      prioridade,
      coluna,
      pos_x,
      pos_y
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar nota:', error);
    return res.status(500).json({ error: 'Erro ao atualizar nota' });
  }

  return res.status(200).json({ message: 'Nota atualizada com sucesso', data });
}