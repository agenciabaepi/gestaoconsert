import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const { empresa_id, tipo, os_id, mensagem } = body || {};

    if (!empresa_id || !tipo) {
      return NextResponse.json({ ok: false, error: 'empresa_id e tipo são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('notificacoes')
      .insert({ 
        empresa_id, 
        tipo, 
        os_id: os_id || null, 
        mensagem: mensagem || null,
        lida: false,
        cliente_avisado: false
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}


