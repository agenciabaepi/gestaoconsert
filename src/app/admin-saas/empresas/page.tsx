export const dynamic = 'force-dynamic';

import EmpresasClient from '../EmpresasClient';

export default function EmpresasPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Empresas</h1>
      <p className="text-sm text-gray-600 mb-4">Gerencie aprovação, ativação e criação de empresas.</p>
      <EmpresasClient />
    </div>
  );
}


