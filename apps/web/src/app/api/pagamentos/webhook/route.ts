import { NextRequest, NextResponse } from 'next/server';
import { configureMercadoPago } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function upsertFromPaymentId(paymentId: string, rawPayload: any) {
  const { config, Payment } = configureMercadoPago();
  const payment = await new Payment(config).get({ id: paymentId });
  if (!payment) throw new Error('Pagamento não encontrado no MP');

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

  // Buscar pelo payment_id
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .select('id,empresa_id,valor,plano_id')
    .eq('mercadopago_payment_id', String(paymentId))
    .maybeSingle();

  const updateData: any = {
    mercadopago_payment_id: String(paymentId),
    status: payment.status as string,
    status_detail: (payment as any).status_detail || null,
    webhook_received: true,
    webhook_data: rawPayload,
    updated_at: new Date().toISOString(),
  };
  if (payment.status === 'approved') updateData.paid_at = new Date().toISOString();

  if (pagamento?.id) {
    await supabase.from('pagamentos').update(updateData).eq('id', pagamento.id);

    // Se aprovado, ativar assinatura da empresa (tolerante ao plano)
    if ((payment.status as string) === 'approved' && pagamento.empresa_id) {
      const preco = Number(pagamento.valor || 0);
      const now = new Date();
      // Próxima cobrança: dia 10
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth();
      const tenthThis = new Date(Date.UTC(y, m, 10, 0, 0, 0));
      const proxima = now.getTime() < tenthThis.getTime() ? tenthThis.toISOString() : new Date(Date.UTC(y, m + 1, 10, 0, 0, 0)).toISOString();
      const { data: trial } = await supabase
        .from('assinaturas')
        .select('id,plano_id')
        .eq('empresa_id', pagamento.empresa_id)
        .eq('status', 'trial')
        .maybeSingle();
      if (trial?.id) {
        await supabase
          .from('assinaturas')
          .update({ status: 'active', plano_id: pagamento.plano_id || trial.plano_id || null, data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco })
          .eq('id', trial.id);
      } else {
        const { data: plano } = await supabase.from('planos').select('id,preco').eq('preco', preco).maybeSingle();
        await supabase
          .from('assinaturas')
          .insert({ empresa_id: pagamento.empresa_id, plano_id: pagamento.plano_id || plano?.id || null, status: 'active', data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco });
      }
    }
  }
  return payment.status as string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || url.searchParams.get('payment_id') || url.searchParams.get('data.id');
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    if (topic && !String(topic).includes('payment')) {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (!id) return NextResponse.json({ received: true, message: 'no id' });
    const status = await upsertFromPaymentId(String(id), { query: Object.fromEntries(url.searchParams.entries()) });
    return NextResponse.json({ received: true, payment_id: id, status });
  } catch (error) {
    console.error('Erro no webhook GET:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    let body: any = {};
    try { body = JSON.parse(raw); } catch { body = {}; }

    // MP pode enviar diferentes formatos: { type: 'payment', data: { id } } ou { action: 'payment.updated', data: { id } }
    const type = body?.type || body?.topic || body?.action || '';
    const paymentId = body?.data?.id || body?.id || body?.resource?.split('/').pop();
    if (type && !String(type).includes('payment')) {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (!paymentId) return NextResponse.json({ received: true, message: 'no id' });

    const status = await upsertFromPaymentId(String(paymentId), body);
    return NextResponse.json({ received: true, payment_id: paymentId, status });
  } catch (error) {
    console.error('Erro no webhook POST:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}