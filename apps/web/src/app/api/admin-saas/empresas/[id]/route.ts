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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ok = await isAuthorized(req);
    if (!ok) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { status, motivoBloqueio, ativo } = body;

    const supabase = getSupabaseAdmin();
    const updates: Record<string, any> = {};
    if (typeof status === 'string') updates.status = status;
    if (typeof motivoBloqueio === 'string') updates.motivoBloqueio = motivoBloqueio;
    if (typeof ativo === 'boolean') updates.ativo = ativo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, message: 'Nada para atualizar' }, { status: 400 });
    }

    const { error } = await supabase.from('empresas').update(updates).eq('id', id);
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


