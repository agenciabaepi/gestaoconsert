
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
// redirect não é necessário no fluxo atual

export const dynamic = 'force-dynamic';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { [key: string]: unknown }) {
          try { cookieStore.set(name, value, options); } catch {}
        },
        remove(name: string, options: { [key: string]: unknown }) {
          try { cookieStore.set(name, '', { ...options, maxAge: 0 }); } catch {}
        },
      },
    }
  );
}

// Mantido para futura evolução (2FA/whitelist); não utilizado no fluxo com cookie

export default async function AdminSaaSPage() {
  const c = await cookies();
  const gateCookie = c.get('admin_saas_access')?.value === '1';
  if (!gateCookie) {
    return (
      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Admin do SaaS</h1>
        <p className="text-sm text-gray-600 mb-4">Digite o código de acesso temporário para entrar.</p>
        <form method="get" action="/api/admin-saas/gate" className="space-y-3">
          <input name="code" placeholder="Código de acesso" className="w-full border rounded px-3 py-2" />
          <button type="submit" className="w-full bg-black text-white rounded px-3 py-2">Entrar</button>
        </form>
        <p className="text-xs text-gray-500 mt-4">Configurar em ADMIN_SAAS_ACCESS_CODE.</p>
      </div>
    );
  }

  // A partir daqui, acesso liberado (via cookie). Buscar user só para exibir e métricas.
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Buscar métricas via API, encaminhando cookies (inclui o cookie do gate)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const metricsRes = await fetch(`${baseUrl}/api/admin-saas/metrics`, { cache: 'no-store' });
  const metricsJson = metricsRes.ok ? await metricsRes.json() : null;
  const metrics: { empresas: number; usuarios: number; assinaturas: number; pagamentos: number; assinaturasPorStatus: Record<string, number>; pagamentosPorStatus: Record<string, number> } = metricsJson?.ok
    ? metricsJson
    : { empresas: 0, usuarios: 0, assinaturas: 0, pagamentos: 0, assinaturasPorStatus: {}, pagamentosPorStatus: {} };

  const assinaturasPorStatus = metrics.assinaturasPorStatus || {};
  const pagamentosPorStatus = metrics.pagamentosPorStatus || {};

  // UI simples (server component)
  return (
    <div className="max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Admin da Plataforma (SaaS)</h1>
      <p className="text-xs text-gray-500 mb-4">Logado como: <span className="font-mono">{user?.email}</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-green-50 flex items-center justify-center">
            <span className="text-green-600 text-lg">🏢</span>
          </div>
          <div className="text-sm text-gray-500">Empresas</div>
          <div className="ml-auto text-3xl font-bold">{metrics.empresas}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-green-50 flex items-center justify-center">
            <span className="text-green-600 text-lg">👤</span>
          </div>
          <div className="text-sm text-gray-500">Usuários</div>
          <div className="ml-auto text-3xl font-bold">{metrics.usuarios}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-green-50 flex items-center justify-center">
            <span className="text-green-600 text-lg">💸</span>
          </div>
          <div className="text-sm text-gray-500">Pagamentos</div>
          <div className="ml-auto text-3xl font-bold">{metrics.pagamentos}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-green-50 flex items-center justify-center">
            <span className="text-green-600 text-lg">📄</span>
          </div>
          <div className="text-sm text-gray-500">Assinaturas</div>
          <div className="ml-auto text-3xl font-bold">{metrics.assinaturas}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-2">Assinaturas por status</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(assinaturasPorStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{v}</span></li>
            ))}
            {Object.keys(assinaturasPorStatus).length === 0 && (
              <li className="text-gray-500">Sem dados</li>
            )}
          </ul>
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-2">Pagamentos por status</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(pagamentosPorStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{v}</span></li>
            ))}
            {Object.keys(pagamentosPorStatus).length === 0 && (
              <li className="text-gray-500">Sem dados</li>
            )}
          </ul>
        </div>
      </div>

      <form
        action={async (formData: FormData) => {
          'use server';
          const dias = formData.get('dias')?.toString() || '7';
          // Chama a rota de reconciliação (autorização por e-mail de plataforma)
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/pagamentos/reconciliar?dias=${dias}`, {
            cache: 'no-store',
          });
        }}
        className="mt-6 p-4 border rounded-lg bg-white flex items-center gap-2"
      >
        <label className="text-sm text-gray-600">Reconciliar últimos</label>
        <input name="dias" defaultValue="7" className="w-16 border rounded px-2 py-1 text-sm" />
        <span className="text-sm text-gray-600">dias</span>
        <button type="submit" className="ml-auto px-3 py-2 text-sm bg-black text-white rounded">Reconciliar agora</button>
      </form>

      <p className="text-xs text-gray-500 mt-3">Apenas e-mails listados em PLATFORM_ADMIN_EMAILS podem acessar.</p>

      {gateCookie && (
        <div className="mt-6">
          <EmpresasSection />
        </div>
      )}
    </div>
  );
}



// Import dinâmico do componente cliente para evitar SSR
import EmpresasSection from './EmpresasClient';
