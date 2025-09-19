import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const supabase = await createServerSupabaseClient();
    const url = new URL(req.url);
    const empresaIdParam = url.searchParams.get('empresaId');
    let empresaId = empresaIdParam || '';
    if (!empresaId) {
      // Tenta obter usuário logado (se os cookies/sessão estiverem visíveis no server)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ ok: false, reason: 'no_user' }, { status: 200 });
      const { data: usuario } = await admin
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .limit(1)
        .single();
      empresaId = usuario?.empresa_id || '';
      if (!empresaId) return NextResponse.json({ ok: false, reason: 'no_empresa' }, { status: 200 });
    }

    const { data: assinatura } = await admin
      .from('assinaturas')
      .select('status, proxima_cobranca')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!assinatura) {
      return NextResponse.json({ ok: false, reason: 'no_assinatura', empresaId });
    }

    // Enriquecimento para debug (datas no fuso local)
    const now = new Date();
    const proxima = assinatura?.proxima_cobranca ? new Date(assinatura.proxima_cobranca) : null;
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = !!proxima && proxima.toDateString() === tomorrow.toDateString();

    return NextResponse.json({ ok: true, empresaId, assinatura, isTomorrow, now: now.toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'exception', error: String(e) }, { status: 200 });
  }
}


