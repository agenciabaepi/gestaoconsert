'use client'

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';

type Row = {
  id: string;
  empresa_id: string | null;
  empresa: { id: string; nome: string; email: string | null } | null;
  mercadopago_payment_id: string | null;
  status: string | null;
  status_detail?: string | null;
  valor: number | null;
  created_at: string | null;
  updated_at?: string | null;
  paid_at: string | null;
  external_reference?: string | null;
}

type ListResponse = { ok: boolean; items: Row[]; total: number; page: number; pageSize: number };

export default function ListarPagamentosClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function fetchList(opts?: { keepPage?: boolean }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(opts?.keepPage ? page : 1), pageSize: String(pageSize), expand: 'mp' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin-saas/pagamentos?${params.toString()}`, { cache: 'no-store' });
      const json: ListResponse = await res.json();
      if (!res.ok || !json.ok) throw new Error('Falha ao listar');
      setItems(json.items || []);
      setTotal(json.total || 0);
      if (!opts?.keepPage) setPage(1);
    } catch (e) {
      setError('Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }

  async function manualApprove(row: Row) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const res = await fetch(`${baseUrl}/api/admin-saas/pagamentos/aprovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagamento_id: row.id }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error('Falha ao aprovar');
    await fetchList({ keepPage: true });
  }

  useEffect(() => {
    fetchList({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por payment_id ou id" className="border rounded px-3 py-2 text-sm w-full max-w-xs" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-2 text-sm">
          <option value="">Todos status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="cancelled">cancelled</option>
        </select>
        <Button onClick={() => fetchList()}>Filtrar</Button>
      </div>

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Empresa</th>
              <th className="px-3 py-2 text-left">Payment ID</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ref.</th>
              <th className="px-3 py-2 text-left">Valor</th>
              <th className="px-3 py-2 text-left">Criado</th>
              <th className="px-3 py-2 text-left">Atualizado</th>
              <th className="px-3 py-2 text-left">Pago em</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.empresa?.nome || '-'}</div>
                  <div className="text-gray-500 text-xs">{r.empresa?.email || '-'}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.mercadopago_payment_id || '-'}</td>
                <td className="px-3 py-2">{(r as any).mp?.status || r.status || '-'}</td>
                <td className="px-3 py-2 text-xs">{(r as any).mp?.external_reference || r.external_reference || '-'}</td>
                <td className="px-3 py-2">{typeof r.valor === 'number' ? r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                <td className="px-3 py-2">{(r as any).mp?.date_created ? new Date((r as any).mp?.date_created).toLocaleString('pt-BR') : (r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-')}</td>
                <td className="px-3 py-2">{(r as any).mp?.date_last_updated ? new Date((r as any).mp?.date_last_updated).toLocaleString('pt-BR') : (r.updated_at ? new Date(r.updated_at).toLocaleString('pt-BR') : '-')}</td>
                <td className="px-3 py-2">{(r as any).mp?.date_approved ? new Date((r as any).mp?.date_approved).toLocaleString('pt-BR') : (r.paid_at ? new Date(r.paid_at).toLocaleString('pt-BR') : '-')}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => window.open(`/api/admin-saas/pagamentos/status?${new URLSearchParams({ payment_id: r.mercadopago_payment_id || '' }).toString()}`, '_blank')}>Ver status</Button>
                    {r.status !== 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => manualApprove(r)}>Aprovar manual</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">Nenhum pagamento encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-600">{total} registros</div>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <span className="text-sm">{page} / {totalPages}</span>
          <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}


