import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

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

export async function POST(req: NextRequest) {
  try {
    const ok = await isAuthorized(req);
    if (!ok) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const { pagamento_id, payment_id } = await req.json();
    if (!pagamento_id && !payment_id) return NextResponse.json({ ok: false, message: 'informe pagamento_id ou payment_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const match = pagamento_id ? { id: pagamento_id } : { mercadopago_payment_id: payment_id };
    const { error } = await supabase
      .from('pagamentos')
      .update({ status: 'approved', status_detail: 'manual_approved', paid_at: new Date().toISOString() })
      .match(match);
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


