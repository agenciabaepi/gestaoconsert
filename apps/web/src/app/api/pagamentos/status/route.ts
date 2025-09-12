import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { configureMercadoPago } from '@/lib/mercadopago';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagamentoId = searchParams.get('pagamento_id');
    const paymentId = searchParams.get('payment_id');
    const mockApprove = searchParams.get('mock_approve');

    if (!pagamentoId && !paymentId) {
      return NextResponse.json({ error: 'pagamento_id ou payment_id é obrigatório' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: request.headers.get('authorization') || '',
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Montar query de maneira flexível: se vier id/payment_id, não filtramos por usuario_id
    let query = supabase
      .from('pagamentos')
      .select('id, status, mercadopago_payment_id, paid_at')
      .limit(1);

    if (pagamentoId) {
      query = query.eq('id', pagamentoId);
    } else if (paymentId) {
      query = query.eq('mercadopago_payment_id', paymentId);
    } else {
      // fallback por usuário quando nenhum id específico é fornecido
      query = query.eq('usuario_id', user.id);
    }

    // Em modo mock, podemos aprovar o pagamento diretamente
    if (mockApprove === '1' && (pagamentoId || paymentId)) {
      await supabase
        .from('pagamentos')
        .update({ status: 'approved', status_detail: 'accredited', paid_at: new Date().toISOString() })
        .or(`id.eq.${pagamentoId || 'x'},mercadopago_payment_id.eq.${paymentId || 'x'}`);
    }

    let { data, error } = await query.single();

    // Se não achou no banco mas temos paymentId, consultar Mercado Pago direto
    if ((error || !data) && paymentId) {
      try {
        const { config, Payment } = configureMercadoPago();
        const mpPayment = await new Payment(config).get({ id: paymentId });
        if (mpPayment?.status) {
          // Opcional: tentar atualizar no banco se existir o registro
          await supabase
            .from('pagamentos')
            .update({
              status: mpPayment.status as string,
              status_detail: (mpPayment as any).status_detail || null,
              paid_at: mpPayment.status === 'approved' ? new Date().toISOString() : null,
            })
            .eq('mercadopago_payment_id', paymentId);

          return NextResponse.json({
            payment_id: paymentId,
            status: mpPayment.status as string,
          });
        }
      } catch (_) {}
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Fallback: se ainda estiver pendente e tivermos paymentId, consultar o Mercado Pago diretamente
    if (data && data.status !== 'approved' && paymentId) {
      try {
        const { config, Payment } = configureMercadoPago();
        const mpPayment = await new Payment(config).get({ id: paymentId });
        if (mpPayment?.status && mpPayment.status !== data.status) {
          const updates: any = { status: mpPayment.status as string };
          if ((mpPayment as any).status_detail) updates.status_detail = (mpPayment as any).status_detail;
          if (mpPayment.status === 'approved') {
            updates.paid_at = new Date().toISOString();
          }
          const { data: updated } = await supabase
            .from('pagamentos')
            .update(updates)
            .eq('id', data.id)
            .select('id, status, mercadopago_payment_id, paid_at')
            .single();
          if (updated) data = updated;
        }
      } catch (_) {
        // silencioso
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      pagamento_id: data.id,
      payment_id: data.mercadopago_payment_id,
      status: data.status,
      paid_at: data.paid_at,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}


