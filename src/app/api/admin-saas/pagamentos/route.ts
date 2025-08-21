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

    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const status = url.searchParams.get('status') || '';
    const search = (url.searchParams.get('search') || '').trim();
    const expand = url.searchParams.get('expand') || '';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('pagamentos')
      .select('id, empresa_id, mercadopago_payment_id, status, valor, created_at, paid_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (search) {
      // Busca por payment_id ou id
      query = query.or(`mercadopago_payment_id.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data: rows, error, count } = await query;
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });

    const empresaIds = Array.from(new Set((rows || []).map((r: any) => r.empresa_id).filter(Boolean)));
    const empresaMap: Record<string, any> = {};
    if (empresaIds.length) {
      const { data: empresas } = await supabase.from('empresas').select('id,nome,email').in('id', empresaIds);
      for (const e of empresas || []) empresaMap[e.id] = e;
    }

    let items = (rows || []).map((r: any) => ({
      ...r,
      empresa: empresaMap[r.empresa_id] ? {
        id: empresaMap[r.empresa_id].id,
        nome: empresaMap[r.empresa_id].nome,
        email: empresaMap[r.empresa_id].email || null,
      } : null,
    }));

    if (expand === 'mp') {
      const ids = items.map((r: any) => r.mercadopago_payment_id).filter(Boolean);
      if (ids.length) {
        const { config, Payment } = configureMercadoPago();
        const promises = ids.map((id: string) => new Payment(config).get({ id }).then((p: any) => ({ id, p })).catch(() => ({ id, p: null })));
        const mpResults = await Promise.all(promises);
        const idToMp: Record<string, any> = {};
        for (const { id, p } of mpResults) idToMp[id] = p;
        items = items.map((r: any) => {
          const mp: any = idToMp[r.mercadopago_payment_id || ''] || null;
          if (!mp) return r;
          return {
            ...r,
            mp: {
              status: mp.status || null,
              status_detail: mp.status_detail || null,
              date_created: mp.date_created || null,
              date_approved: mp.date_approved || null,
              date_last_updated: mp.date_last_updated || null,
              external_reference: mp.external_reference || null,
              transaction_amount: mp.transaction_amount || null,
            },
          };
        });
      }
    }

    return NextResponse.json({ ok: true, items, page, pageSize, total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


