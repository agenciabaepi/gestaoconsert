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
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').trim();
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const status = url.searchParams.get('status') || '';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('empresas').select('*', { count: 'exact' })
      .order('nome', { ascending: true })
      .range(from, to);

    if (search) {
      // Buscar por nome ou cnpj/email simples
      query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: empresas, error, count } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    const empresaIds = (empresas || []).map((e: any) => e.id);

    // Contadores básicos por empresa (chamadas simples por empresa para manter compatibilidade)
    async function countBy(table: string, empresaId: string) {
      const { count } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId);
      return count || 0;
    }
    async function countProdutos(empresaId: string) {
      const { count } = await supabase
        .from('produtos_servicos')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('tipo', 'produto');
      return count || 0;
    }
    async function countServicos(empresaId: string) {
      const { count } = await supabase
        .from('produtos_servicos')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('tipo', 'servico');
      return count || 0;
    }

    async function storageUsoMb(empresaId: string): Promise<number> {
      // Somente bucket 'produtos' com prefixo produtos/{empresa_id}/
      // Nota: ordens-imagens não possui empresa_id no path; será adicionado depois
      const { data, error } = await supabase
        .from('storage.objects')
        .select('name,size')
        .eq('bucket_id', 'produtos')
        .like('name', `produtos/${empresaId}/%`);
      if (error || !data) return 0;
      const totalBytes = data.reduce((acc: number, obj: any) => acc + (Number(obj.size) || 0), 0);
      return Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // MB com 2 casas
    }

    const enriched = await Promise.all((empresas || []).map(async (e: any) => {
      const [usuarios, produtos, servicos, ordens, usoMb] = await Promise.all([
        countBy('usuarios', e.id),
        countProdutos(e.id),
        countServicos(e.id),
        countBy('ordens_servico', e.id),
        storageUsoMb(e.id),
      ]);

      // Assinatura e cobrança
      let assinatura: any = null;
      try {
        const { data } = await supabase
          .from('assinaturas')
          .select('id,status,proxima_cobranca,plano_id,created_at')
          .eq('empresa_id', e.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        assinatura = data || null;
      } catch {}

      let planoNome = 'Acesso Completo';
      if (assinatura?.plano_id) {
        try {
          const { data: plano } = await supabase
            .from('planos')
            .select('nome')
            .eq('id', assinatura.plano_id)
            .limit(1)
            .single();
          if (plano?.nome) planoNome = plano.nome;
        } catch {}
      }

      let ultimoPagamento: any = null;
      try {
        const { data } = await supabase
          .from('pagamentos')
          .select('status,paid_at,created_at,valor')
          .eq('empresa_id', e.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        ultimoPagamento = data || null;
      } catch {}

      // Cálculo de vencimento
      let vencido = false;
      let cobrancaStatus = '—';
      const hoje = new Date();
      if (assinatura?.status === 'trial') {
        cobrancaStatus = 'Trial';
      } else if (assinatura?.status === 'active' || assinatura?.status === 'ativa') {
        cobrancaStatus = 'Em dia';
        if (assinatura?.proxima_cobranca) {
          const prox = new Date(assinatura.proxima_cobranca);
          if (prox < new Date(hoje.toDateString())) {
            vencido = true;
            cobrancaStatus = 'Vencido';
          }
        }
      } else if (assinatura?.status) {
        cobrancaStatus = assinatura.status;
      }

      const billing = {
        plano: { id: assinatura?.plano_id || null, nome: planoNome },
        assinaturaStatus: assinatura?.status || null,
        proximaCobranca: assinatura?.proxima_cobranca || null,
        vencido,
        cobrancaStatus,
        ultimoPagamentoStatus: ultimoPagamento?.status || null,
        ultimoPagamentoPagoEm: ultimoPagamento?.paid_at || null,
        ultimoPagamentoValor: ultimoPagamento?.valor || null,
      };

      return { ...e, metrics: { usuarios, produtos, servicos, ordens, usoMb }, billing };
    }));

    return NextResponse.json({ ok: true, items: enriched, page, pageSize, total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}


