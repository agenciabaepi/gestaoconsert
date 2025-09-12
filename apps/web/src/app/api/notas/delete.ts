import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID da nota é obrigatório' });
  }

  // Cria o cliente do Supabase em tempo de execução com Service Role para evitar RLS e erros no build
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('notas').delete().eq('id', id);

  if (error) {
    console.error('Erro ao deletar nota:', error);
    return res.status(500).json({ message: 'Erro ao deletar nota' });
  }

  return res.status(200).json({ message: 'Nota deletada com sucesso' });
}