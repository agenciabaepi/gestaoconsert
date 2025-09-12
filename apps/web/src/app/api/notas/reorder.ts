import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { updates } = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: 'Invalid request format' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const updatesPromises = updates.map((item: { id: string, ordem: number }) =>
      supabase
        .from('notas')
        .update({ ordem: item.ordem })
        .eq('id', item.id)
    );

    await Promise.all(updatesPromises);

    return res.status(200).json({ message: 'Notas reordered successfully' });
  } catch (error) {
    console.error('Erro ao reordenar notas:', error);
    return res.status(500).json({ message: 'Erro ao reordenar notas' });
  }
}