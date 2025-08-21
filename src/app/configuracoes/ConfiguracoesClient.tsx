'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ConfiguracoesPage() {
  const [param, setParam] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const valor = searchParams.get('chave');
    setParam(valor);
  }, [searchParams]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      {param ? (
        <p className="mt-4 text-gray-600">Parâmetro recebido: {param}</p>
      ) : (
        <p className="mt-4 text-gray-600">Esta é a página de configurações do sistema.</p>
      )}
    </div>
  );
}