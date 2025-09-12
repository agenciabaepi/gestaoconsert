'use client'

import { useState } from 'react';
import { Button } from '@/components/Button';

export default function PagamentoStatusChecker() {
  const [paymentId, setPaymentId] = useState('');
  const [pagamentoId, setPagamentoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!paymentId && !pagamentoId) {
        setError('Informe payment_id ou pagamento_id');
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (paymentId) params.set('payment_id', paymentId.trim());
      if (pagamentoId) params.set('pagamento_id', pagamentoId.trim());
      // Usar rota interna do admin (sem depender de sessão do usuário)
      const res = await fetch(`/api/admin-saas/pagamentos/status?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao consultar');
      setResult(json);
    } catch (e: any) {
      setError(e?.message || 'Erro ao consultar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-2">Consultar status no Mercado Pago</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">payment_id (Mercado Pago)</label>
          <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="ex: 1234567890" />
        </div>
        <div>
          <label className="text-xs text-gray-600">pagamento_id (interno)</label>
          <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={pagamentoId} onChange={e => setPagamentoId(e.target.value)} placeholder="UUID do pagamento" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={handleCheck} disabled={loading}>{loading ? 'Consultando...' : 'Verificar status'}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      {result && (
        <pre className="mt-3 bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}


