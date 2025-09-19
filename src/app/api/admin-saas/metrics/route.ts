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

export async function GET(req: NextRequest) {
  try {
    const ok = await isAuthorized(req);
    if (!ok) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();

    const [empresasCount, usuariosCount, assinaturasCount, pagamentosCount] = await Promise.all([
      supabase.from('empresas').select('id', { count: 'exact', head: true }),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }),
      supabase.from('assinaturas').select('id,status', { count: 'exact', head: true }),
      supabase.from('pagamentos').select('id,status', { count: 'exact', head: true }),
    ]);

    const assinaturasPorStatus = await supabase
      .from('assinaturas')
      .select('status', { count: 'exact' })
      .then(r => {
        if (r.error || !r.data) return {} as Record<string, number>;
        const map: Record<string, number> = {};
        for (const row of r.data as any[]) {
          const s = String(row.status || 'desconhecido');
          map[s] = (map[s] || 0) + 1;
        }
        return map;
      });

    const pagamentosPorStatus = await supabase
      .from('pagamentos')
      .select('status', { count: 'exact' })
      .then(r => {
        if (r.error || !r.data) return {} as Record<string, number>;
        const map: Record<string, number> = {};
        for (const row of r.data as any[]) {
          const s = String(row.status || 'desconhecido');
          map[s] = (map[s] || 0) + 1;
        }
        return map;
      });

    return NextResponse.json({
      ok: true,
      empresas: empresasCount.count || 0,
      usuarios: usuariosCount.count || 0,
      assinaturas: assinaturasCount.count || 0,
      pagamentos: pagamentosCount.count || 0,
      assinaturasPorStatus,
      pagamentosPorStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}

 
