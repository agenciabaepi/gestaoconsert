'use client'

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

type Empresa = {
  id: string;
  nome: string;
  email?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  status?: string | null; // pendente, aprovada, reprovada
  ativo?: boolean | null;
  created_at?: string | null;
  metrics?: {
    usuarios: number;
    produtos: number;
    servicos: number;
    ordens: number;
    usoMb: number; // storage
  }
}

type ListResponse = {
  ok: boolean;
  items: Empresa[];
  page: number;
  pageSize: number;
  total: number;
}

export default function EmpresasClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Empresa[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ nome: '', email: '', cnpj: '' });
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function fetchItems(opts?: { keepPage?: boolean }) {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const params = new URLSearchParams({
        page: String(opts?.keepPage ? page : 1),
        pageSize: String(pageSize),
        search,
        status,
      });
      const res = await fetch(`${baseUrl}/api/admin-saas/empresas?${params.toString()}`, { cache: 'no-store' });
      const json: ListResponse = await res.json();
      if (!res.ok || !json.ok) throw new Error(json as any);
      setItems(json.items || []);
      setTotal(json.total || 0);
      if (!opts?.keepPage) setPage(1);
    } catch (e) {
      console.error(e);
      setError('Não foi possível carregar as empresas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function patchEmpresa(id: string, payload: Record<string, unknown>) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const res = await fetch(`${baseUrl}/api/admin-saas/empresas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error('Falha na atualização');
    await fetchItems({ keepPage: true });
  }

  async function handleApprove(e: Empresa) {
    await patchEmpresa(e.id, { status: 'aprovada', ativo: true });
  }
  async function handleReject(e: Empresa) {
    await patchEmpresa(e.id, { status: 'reprovada', ativo: false });
  }
  async function handleToggleActive(e: Empresa) {
    await patchEmpresa(e.id, { ativo: !e.ativo });
  }

  async function handleCreate() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const res = await fetch(`${baseUrl}/api/admin-saas/empresas/criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createData }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error('Falha ao criar');
    setShowCreate(false);
    setCreateData({ nome: '', email: '', cnpj: '' });
    await fetchItems({ keepPage: true });
  }

  return (
    <div className="mt-8 p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, CNPJ, e-mail"
          className="border rounded px-3 py-2 text-sm w-full max-w-xs"
        />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-2 text-sm">
          <option value="">Todos status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovada">Aprovada</option>
          <option value="reprovada">Reprovada</option>
        </select>
        <Button onClick={() => fetchItems()} className="ml-1">Filtrar</Button>
        <div className="ml-auto" />
        <Button onClick={() => setShowCreate(true)}>Adicionar empresa</Button>
      </div>

      {error && (
        <div className="mb-2 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Empresa</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ativa</th>
              <th className="px-3 py-2 text-left">Criada em</th>
              <th className="px-3 py-2 text-left">Plano</th>
              <th className="px-3 py-2 text-left">Cobrança</th>
              <th className="px-3 py-2 text-left">Usuários</th>
              <th className="px-3 py-2 text-left">Produtos</th>
              <th className="px-3 py-2 text-left">Serviços</th>
              <th className="px-3 py-2 text-left">OS</th>
              <th className="px-3 py-2 text-left">Storage (MB)</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  <div className="font-medium">{e.nome}</div>
                  <div className="text-gray-500 text-xs">{e.email || '-'} • {e.cnpj || '-'}</div>
                </td>
                <td className="px-3 py-2">
                  {e.status ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${e.status === 'aprovada' ? 'bg-green-100 text-green-800' : ''}
                      ${e.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${e.status === 'reprovada' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {e.status}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${e.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{e.ativo ? 'Ativa' : 'Inativa'}</span>
                </td>
                <td className="px-3 py-2">{e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="px-3 py-2">{e.billing?.plano?.nome || '—'}</td>
                <td className="px-3 py-2">
                  {e.billing ? (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${e.billing.vencido ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{e.billing.cobrancaStatus || '—'}</span>
                      {e.billing.proximaCobranca && (
                        <span className="text-xs text-gray-500">próx: {new Date(e.billing.proximaCobranca).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">{e.metrics?.usuarios ?? 0}</td>
                <td className="px-3 py-2">{e.metrics?.produtos ?? 0}</td>
                <td className="px-3 py-2">{e.metrics?.servicos ?? 0}</td>
                <td className="px-3 py-2">{e.metrics?.ordens ?? 0}</td>
                <td className="px-3 py-2">{e.metrics?.usoMb ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleApprove(e)} className="bg-green-600 hover:bg-green-700 text-white">Aprovar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(e)} className="bg-red-600 hover:bg-red-700">Reprovar</Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(e)} className="border-gray-300">
                      {e.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">Nenhuma empresa encontrada</td>
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md">
            <div className="text-lg font-semibold mb-3">Adicionar empresa</div>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Nome"
                value={createData.nome}
                onChange={e => setCreateData({ ...createData, nome: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="E-mail (opcional)"
                value={createData.email}
                onChange={e => setCreateData({ ...createData, email: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="CNPJ (opcional)"
                value={createData.cnpj}
                onChange={e => setCreateData({ ...createData, cnpj: e.target.value })}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


