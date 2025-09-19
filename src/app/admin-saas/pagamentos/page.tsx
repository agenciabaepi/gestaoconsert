export const dynamic = 'force-dynamic';

import PagamentoStatusChecker from '../PagamentoStatusChecker';
import ListarPagamentosClient from './ListarPagamentosClient';

export default function PagamentosPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Pagamentos</h1>
      <p className="text-sm text-gray-600 mb-4">Reconciliar pendências, consultar status e exportar.</p>
      <div className="grid grid-cols-1 gap-6">
        <PagamentoStatusChecker />
        <ListarPagamentosClient />
      </div>
    </div>
  );
}


