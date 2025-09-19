// /pages/api/empresa/getNome.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
const supabase = getSupabaseAdmin();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { empresa_id } = req.query;

  if (!empresa_id) return res.status(400).json({ error: 'empresa_id obrigatório' });

  const { data, error } = await supabase
    .from('empresas')
    .select('nome')
    .eq('id', empresa_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Empresa não encontrada' });

  res.status(200).json({ nome: data.nome });
}