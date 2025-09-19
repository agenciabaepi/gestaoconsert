import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { configureMercadoPago } from '@/lib/mercadopago';

// GET /api/pagamentos/reconciliar?dias=7
// Reconciliar pagamentos pendentes consultando o Mercado Pago
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const diasParam = url.searchParams.get('dias');
    const dias = Math.max(1, Math.min(90, parseInt(diasParam || '7', 10) || 7));

    // Autenticação: exige usuário admin logado
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // Autorização: plataforma (dono do SaaS) por e-mail OU token interno
    const tokenHeader = request.headers.get('x-internal-token');
    const tokenOk = tokenHeader && process.env.INTERNAL_ADMIN_TOKEN && tokenHeader === process.env.INTERNAL_ADMIN_TOKEN;
    const emailOk = !!(user?.email && (process.env.PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(user.email.toLowerCase()));
    if (!tokenOk && !emailOk) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { config, Payment } = configureMercadoPago();

    // Buscar pagamentos pending dos últimos N dias
    const limiteData = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
    const { data: pendentes, error: fetchError } = await supabaseAdmin
      .from('pagamentos')
      .select('id, mercadopago_payment_id, status, status_detail, paid_at, created_at')
      .eq('status', 'pending')
      .gte('created_at', limiteData);

    if (fetchError) {
      return NextResponse.json({ error: 'Erro ao buscar pagamentos pending', details: fetchError }, { status: 500 });
    }

    const resultados: Array<{ id: string; payment_id: string | null; anterior: string; novo?: string; atualizado: boolean; erro?: string; }>
      = [];

    for (const p of pendentes || []) {
      const paymentId = p.mercadopago_payment_id;
      if (!paymentId) {
        resultados.push({ id: p.id, payment_id: null, anterior: p.status, atualizado: false, erro: 'Sem mercadopago_payment_id' });
        continue;
      }
      try {
        const mp = await new Payment(config).get({ id: paymentId });
        const novoStatus = (mp?.status as string) || 'unknown';
        if (novoStatus && novoStatus !== p.status) {
          const updates: any = { status: novoStatus };
          if ((mp as any).status_detail) updates.status_detail = (mp as any).status_detail;
          if (novoStatus === 'approved') updates.paid_at = new Date().toISOString();
          await supabaseAdmin
            .from('pagamentos')
            .update(updates)
            .eq('id', p.id);
          resultados.push({ id: p.id, payment_id: paymentId, anterior: p.status, novo: novoStatus, atualizado: true });
        } else {
          resultados.push({ id: p.id, payment_id: paymentId, anterior: p.status, atualizado: false });
        }
      } catch (e: any) {
        resultados.push({ id: p.id, payment_id: paymentId, anterior: p.status, atualizado: false, erro: e?.message || 'Erro ao consultar MP' });
      }
    }

    return NextResponse.json({
      dias,
      total_analisados: pendentes?.length || 0,
      atualizados: resultados.filter(r => r.atualizado).length,
      resultados,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}


