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

    const { nome, email, cnpj, telefone, endereco, plano_id } = await req.json();
    if (!nome) return NextResponse.json({ ok: false, message: 'nome é obrigatório' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: empresa, error: empErr } = await supabase
      .from('empresas')
      .insert({ nome, email, cnpj, telefone, endereco, status: 'pendente', ativo: false })
      .select()
      .single();

    if (empErr) return NextResponse.json({ ok: false, error: empErr }, { status: 500 });

    if (plano_id) {
      // cria assinatura em trial ativa para iniciar
      await supabase.from('assinaturas').insert({
        empresa_id: empresa.id,
        plano_id,
        status: 'trial',
        data_inicio: new Date().toISOString(),
        data_trial_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        valor: 0,
      });
    }

    return NextResponse.json({ ok: true, empresa });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


