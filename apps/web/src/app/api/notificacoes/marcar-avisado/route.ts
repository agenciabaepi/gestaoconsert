import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const { notificacao_id } = body || {};

    if (!notificacao_id) {
      return NextResponse.json({ ok: false, error: 'notificacao_id é obrigatório' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('notificacoes')
      .update({ cliente_avisado: true, lida: true })
      .eq('id', notificacao_id)
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
