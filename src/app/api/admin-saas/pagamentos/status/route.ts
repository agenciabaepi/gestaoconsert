import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { configureMercadoPago } from '@/lib/mercadopago';

function isDev() {
  return process.env.NODE_ENV !== 'production' || process.env.ADMIN_SAAS_OPEN === '1';
}

async function isAuthorized(req: NextRequest) {
  if (isDev()) return true;
  const cookieStore = await cookies();
  const hasGate = cookieStore.get('admin_saas_access')?.value === '1';
  if (hasGate) return true;
  const email = req.headers.get('x-user-email') || '';
  const allowed = (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const ok = await isAuthorized(req);
    if (!ok) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const pagamento_id = url.searchParams.get('pagamento_id');
    const payment_id = url.searchParams.get('payment_id');
    if (!pagamento_id && !payment_id) {
      return NextResponse.json({ ok: false, message: 'informe pagamento_id ou payment_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    function nextBillingDay10(from: Date): string {
      const y = from.getUTCFullYear();
      const m = from.getUTCMonth();
      const tenthThisMonth = new Date(Date.UTC(y, m, 10, 0, 0, 0));
      const target = from.getTime() < tenthThisMonth.getTime()
        ? tenthThisMonth
        : new Date(Date.UTC(y, m + 1, 10, 0, 0, 0));
      return target.toISOString();
    }

    async function fetchMp(id: string) {
      const { config, Payment } = configureMercadoPago();
      const mpPayment = await new Payment(config).get({ id });
      if (!mpPayment || !mpPayment.status) throw new Error('Pagamento não encontrado no MP');
      const anyMp: any = mpPayment as any;
      return {
        status: mpPayment.status as string,
        status_detail: anyMp.status_detail || null,
        date_created: anyMp.date_created || null,
        date_approved: anyMp.date_approved || null,
        date_last_updated: anyMp.date_last_updated || null,
        external_reference: anyMp.external_reference || null,
        transaction_amount: anyMp.transaction_amount || null,
      };
    }

    // Caminho 1: veio payment_id (preferível) → busca MP, sincroniza DB
    if (payment_id) {
      try {
        const mp = await fetchMp(payment_id);
        // Atualiza registro local se existir
        const { data: row } = await supabase
          .from('pagamentos')
          .select('id,empresa_id,valor')
          .eq('mercadopago_payment_id', payment_id)
          .maybeSingle();
        if (row?.id) {
          const updates: any = { status: mp.status, status_detail: mp.status_detail };
          if (mp.date_created) updates.created_at = new Date(mp.date_created).toISOString();
          if (mp.date_last_updated) updates.updated_at = new Date(mp.date_last_updated).toISOString();
          if (mp.date_approved || mp.status === 'approved') updates.paid_at = new Date(mp.date_approved || Date.now()).toISOString();
          await supabase.from('pagamentos').update(updates).eq('id', row.id);

          // Ativar assinatura quando aprovado (tolerante ao plano)
          if (mp.status === 'approved' && row.empresa_id) {
            const preco = Number(row.valor || 0);
            const now = new Date();
            const proxima = nextBillingDay10(now);
            // Atualiza trial se existir (mantém plano_id atual)
            const { data: trial } = await supabase
              .from('assinaturas')
              .select('id,plano_id')
              .eq('empresa_id', row.empresa_id)
              .eq('status', 'trial')
              .maybeSingle();
            if (trial?.id) {
              await supabase
                .from('assinaturas')
                .update({ status: 'active', data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco })
                .eq('id', trial.id);
            } else {
              const { data: plano } = await supabase.from('planos').select('id,preco').eq('preco', preco).maybeSingle();
              await supabase
                .from('assinaturas')
                .insert({ empresa_id: row.empresa_id, plano_id: plano?.id || null, status: 'active', data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco });
            }
          }
        }
        return NextResponse.json({ ok: true, payment_id, status: mp.status, ...mp });
      } catch (e: any) {
        return NextResponse.json({ ok: false, payment_id, error: e?.message || 'Falha ao consultar MP' }, { status: 500 });
      }
    }

    // Caminho 2: veio pagamento_id → pega payment_id local e repete fluxo
    let { data, error } = await supabase
      .from('pagamentos')
      .select('id, mercadopago_payment_id, status, paid_at, empresa_id, valor, plano_id')
      .eq('id', pagamento_id)
      .single();

    if (error || !data) return NextResponse.json({ ok: false, message: 'não encontrado' }, { status: 404 });
    if (!data.mercadopago_payment_id) return NextResponse.json({ ok: false, message: 'registro sem payment_id' }, { status: 400 });

    try {
      const mp = await fetchMp(data.mercadopago_payment_id);
      const updates: any = { status: mp.status, status_detail: mp.status_detail };
      if (mp.date_created) updates.created_at = new Date(mp.date_created).toISOString();
      if (mp.date_last_updated) updates.updated_at = new Date(mp.date_last_updated).toISOString();
      if (mp.date_approved || mp.status === 'approved') updates.paid_at = new Date(mp.date_approved || Date.now()).toISOString();
      const { data: updated } = await supabase
        .from('pagamentos')
        .update(updates)
        .eq('id', data.id)
        .select('id, mercadopago_payment_id, status, paid_at, empresa_id, valor')
        .single();

      // Ativar assinatura quando aprovado
      if ((mp.status === 'approved') && updated?.empresa_id) {
        const preco = Number(updated.valor || 0);
        const now = new Date();
        const proxima = nextBillingDay10(now);
        if (updated.plano_id) {
          const { data: trial } = await supabase
            .from('assinaturas')
            .select('id')
            .eq('empresa_id', updated.empresa_id)
            .eq('status', 'trial')
            .maybeSingle();
          if (trial?.id) {
            await supabase
              .from('assinaturas')
              .update({ status: 'active', plano_id: updated.plano_id, data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco })
              .eq('id', trial.id);
          } else {
            await supabase
              .from('assinaturas')
              .insert({ empresa_id: updated.empresa_id, plano_id: updated.plano_id, status: 'active', data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco });
          }
        } else {
          // fallback por preço
          const { data: plano } = await supabase.from('planos').select('id,preco').eq('preco', preco).maybeSingle();
          await supabase
            .from('assinaturas')
            .insert({ empresa_id: updated.empresa_id, plano_id: plano?.id || null, status: 'active', data_inicio: now.toISOString(), data_trial_fim: null, proxima_cobranca: proxima, data_fim: null, valor: preco });
        }
      }

      return NextResponse.json({ ok: true, pagamento_id: data.id, payment_id: data.mercadopago_payment_id, status: updated?.status, paid_at: updated?.paid_at, ...mp });
    } catch (e: any) {
      return NextResponse.json({ ok: false, pagamento_id: data.id, error: e?.message || 'Falha ao consultar MP' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


